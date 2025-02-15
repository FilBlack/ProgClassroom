import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { handler } from "./build/handler.js"
import express from 'express'
import session from 'express-session'
import passport from 'passport'
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser'; 
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid'
import { sequelize, Op, Classroom, Quiz, QuizStudent, ClassroomStudents, ProgUser} from './models.js';
import './passport.js'

declare global {
  namespace Express {
    interface User extends InstanceType<typeof ProgUser> {}
  }
}


declare module "express-session" {
  interface SessionData {
    position?: string;
  }
}

let port = 3000
const app: Express = express();
app.use(bodyParser.json());  // Parse JSON request bodies
app.use(cookieParser());

const sessionSecret: string = String(process.env.GOOGLE_CLIENT_SECRET);

app.use(session({
    secret: sessionSecret,
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Google Authentication
app.get('/auth/google', (req: Request, res: Response, next: NextFunction) => {
    const position = req.query.position as string;
    console.log(position)
    if (position !== 'teacher' && position !== 'student') {
      res.status(400).json({ error: 'Invalid position' });  
    }

    if (!req.session) {
      res.status(500).json({ error: 'Session not initialized' });
    }

    req.session.position = position;
    next();
    
  },passport.authenticate('google', { scope: ['profile', 'email'] })
);


app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    console.log(req.user.position)
    if (req.user.position === 'teacher') {
      res.redirect('/teacher_classroom_list');
    } else {
      res.redirect('/student_classroom_list')
    }
  });


// get_classrooms endpoint
const getClassroomsByTeacher = async (teacherId: string) => {
  try {
    const classrooms = await Classroom.findAll({
      where: {
        teacher_id: teacherId,
      },
    });
    return classrooms;
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    throw error;
  }
};

app.get('/getClassroomsByTeacher', async (req : Request, res :Response) => {
  if (req.user !== undefined && req.isAuthenticated()) {

    const teacherId = String(req.user.googleId as string);
  
    try {
      const classrooms = await getClassroomsByTeacher(teacherId);
      res.json(classrooms);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }

});

app.get('/getClassroomsByStudent', async (req : Request, res :Response) => {
  if (req.user !== undefined && req.isAuthenticated()) {

    const studentEmail = String(req.user.email as string);
    try {
      
      const classroomStudents = await ClassroomStudents.findAll({
        where: { f_student_email: studentEmail }
      });
    
      const classroomIds = classroomStudents.map(classroom => classroom.id);
      const classrooms = await Promise.all(
        classroomIds.map(id => Classroom.findOne({ where: { id } }))
      );

      res.json(classrooms);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }

});

//Student Section

const getStudentsByClassroom = async (classroomId: number): Promise<ProgUser[]> => {
  try {
    const studentClassroomConnections = await ClassroomStudents.findAll({
      where: {
        f_classroom_id: classroomId,
      },
    });
    var students: ProgUser[] = [] 

    for (const connection of studentClassroomConnections) {
      let student = await ProgUser.findAll({
        where: { email: connection.f_student_email }
      });

      if (student.length > 0) {
        students.push(student[0]);
      }
    }

    return students;
  } catch (error) {
    console.error('Error fetching students by classroom:', error);
    throw error;
  }
};

app.get('/getStudentsByClassroom', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated()) {
    const classroomId = Number(req.query.classroomId);
  
    if (isNaN(classroomId)) {
      res.status(500).json({error: "We need a number"})
    }  
  
    try {
      const students = await getStudentsByClassroom(classroomId);
      res.json(students);
    } catch (error) {
      console.error('Error fetching students by classroom:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
});

app.post('/addStudentsToClassroom', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const studentList: string[] = req.body.studentList;
      const currentClassroom: string = req.body.currentClassroom
      const insertPromises = studentList.map(async studentEmail => {
        const [user, created] = await ProgUser.findOrCreate({
          where: { email: studentEmail, position: 'student' },
          defaults: {
            googleId: uuidv4(), // Chance of collision 1 in 2^212 apparently 
            name: 'Pending', 
            profilePicture: null,
            position: 'student',
            isPending: true,
          }
        });
        await ClassroomStudents.create({
          f_classroom_id: Number(currentClassroom), 
          f_student_email: String(studentEmail)
        })
        // Add the connections between quiz and student that arise 
        const quizzes = await Quiz.findAll({
          where: {
            f_classroom_id : currentClassroom
          }
        }) 
        for (const quiz of quizzes) {
          let created = await QuizStudent.create({
            f_student_email: studentEmail,
            f_quiz_id: quiz.id
          }) 
        }
      
        
      });
      await Promise.all(insertPromises);
      
      res.status(201).json({ message: 'Students added to classroom successfully' });
  } catch (error) {
    console.error('Error adding students to classroom:', error);
    res.status(500).json({ error: 'Failed to add students to classroom' });
  }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
})

app.post ('/removeStudentFromClassroom', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const classroomId: number = req.body.classroomId;
      const studentEmail: string = req.body.studentEmail
      const studentId: string = req.body.studentId
      let destroyed = await ClassroomStudents.destroy({
        where: { f_classroom_id: classroomId, f_student_email: studentEmail},
      })
      if (destroyed) {
        const ClassroomQuizes = await Quiz.findAll(
          {where:{ f_classroom_id: classroomId }
        })
        for (const quiz of ClassroomQuizes) {
          destroyed = await QuizStudent.destroy({
            where: {f_quiz_id : quiz.id, f_student_email: studentEmail}
          })
        }
        res.status(201).json({ message: 'Student removed successfully' });
      }  
      else {
        res.status(500).json({ error: 'Failed to remove student' });
      }
    } catch (error) {
      console.error('Error removing student:', error);
      res.status(500).json({ error: 'Failed to remove student' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
})

//Quiz student update to make the connection between student and quiz
async function updateQuizStudentByClassroom(classroomId:number) {
  const allQuizzes: Quiz[] = await Quiz.findAll({
    where: {f_classroom_id:classroomId}
  })

  const classroomStudentsConnections: ClassroomStudents[] = await ClassroomStudents.findAll({
    where: {f_classroom_id: classroomId}
  })

  for (const quiz of allQuizzes) {
    for (const studentConn of classroomStudentsConnections) {
      await QuizStudent.findOrCreate({
        where: {
          f_quiz_id: quiz.id,
          f_student_email: studentConn.f_student_email  
        },
        defaults: {
          answer: null,
          points: null
        }
      });
    }
  }
}




//Classroom section

app.post('/addClassroom', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const classroomName: string = req.body.classroomString;
      const teacherId: string = req.user.googleId
      Classroom.create({
        name: String(classroomName), 
        teacher_id: String(teacherId)
      }).then(student => {
        console.log('Inserted:', student.toJSON());
      })
      .catch(err => console.error('Error:', err));
      res.status(201).json({ message: 'Students added to classroom successfully' });
    } catch (error) {
      console.error('Error adding students to classroom:', error);
      res.status(500).json({ error: 'Failed to add students to classroom' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
})

app.post ('/removeClassroom', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const classroomId: string = req.body.classroomId;
      let destroyed = await Classroom.destroy({
        where: { id: classroomId },
      })
      if (destroyed) {
        // Destroy the things associated with it 
        destroyed = await Quiz.destroy({where:
          {f_classroom_id:classroomId}
        })
        destroyed = await ClassroomStudents.destroy({where:
          {f_classroom_id:classroomId}
        })
        res.status(201).json({ message: 'Classroom removed successfully' });
      }  
      else {
        res.status(500).json({ error: 'Failed to remove classroom' });
      }
    } catch (error) {
      console.error('Error removing classroom:', error);
      res.status(500).json({ error: 'Failed to remove classroom' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
})


// Quiz section

// get Quizes in classroom endpoint 
const getQuizesByClassroom = async (classroomId: number) => {
  try {
    const quizes = await Quiz.findAll({
      where: {
        f_classroom_id: classroomId,
      },
    });
    return quizes;
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    throw error;
  }
};

app.get('/getQuizesByClassroom', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated()) {
    const classroomId = Number(req.query.classroomId);
  
    if (isNaN(classroomId)) {
      res.status(500).json({error: "We need a number"})
    }  
  
    try {
      const quizzes = await getQuizesByClassroom(classroomId);
      res.json(quizzes);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
});

app.post('/addQuizToClassroom', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const currentClassroom: string = req.body.currentClassroom;
      const quizName: string = req.body.quizName;
      const quizQuestion: string = req.body.quizQuestion;
      const quizType: 'plaintext' | 'code' = req.body.quizType;
      const closeAt = req.body.closeAt //Needs more work
      const createdQuiz = await Quiz.create({
        name: String(quizName), 
        question: String(quizQuestion),
        type: quizType,
        f_classroom_id: Number(currentClassroom),
        closeAt: String(closeAt),
        open: true
      })
      const students = await ClassroomStudents.findAll({
        where: {
          f_classroom_id: currentClassroom
        }
      })

      for (const student of students) {
        await QuizStudent.create({
          f_quiz_id: createdQuiz.id,
          f_student_email: student.f_student_email
        })
      }
      
      res.status(201).json({ message: 'Quiz added successfully' });
  } catch (error) {
    console.error('Error adding Quiz:', error);
    res.status(500).json({ error: 'Failed to add quiz' });
  }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
})

app.post ('/removeQuiz', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const quizId: number = req.body.quizId
      let destroyed = await QuizStudent.destroy({
        where: {
          f_quiz_id:quizId
        }
      })
      
      if (destroyed) {
        destroyed = await Quiz.destroy({
          where: {id: quizId},
        })
        res.status(201).json({ message: 'Quiz removed successfully' });
      }  
      else {
        res.status(500).json({ error: 'Failed to remove quiz' });
      }
    } catch (error) {
      console.error('Error removing quiz:', error);
      res.status(500).json({ error: 'Failed to remove quiz' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
})

app.post ('/closeQuiz', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const quizId: number = req.body.quizId
      await Quiz.update(
        { open: false },
        {
          where: {
            id: quizId
          }
        }
      );
      res.status(201).json({message: "Quiz successfuly closed"})
    } catch (error) {
      console.error('Error removing quiz:', error);
      res.status(500).json({ error: 'Failed to remove quiz' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.use(express.static('build/client'));

// Eats all the remaining routes
app.use(handler)


// For debuggin to print all paths 
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(middleware.route.path);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        console.log(handler.route.path);
      }
    });
  }
});

//Schedule quiz closing 

cron.schedule('* * * * *', async () => {
  try {
    const nowISO = new Date().toISOString();
    // Update quizzes that are still open but whose closeAt timestamp has passed
    const [updated] = await Quiz.update(
      { open: false },
      {
        where: {
          open: true,
          closeAt: {
            [Op.lte]: nowISO
          }
        }
      }
    );
    if (updated) {
      console.log(`Closed ${updated} expired quizzes.`);
    }
  } catch (error) {
    console.error('Error closing expired quizzes:', error);
  }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
