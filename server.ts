import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { handler } from "./build/handler.js"
import express from 'express'
import session from 'express-session'
import passport from 'passport'
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser'; 
import { sequelize, Classroom, Quiz, QuizStudent, ClassroomStudents, ProgUser} from './models.js';
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
        where: { googleId: connection.f_student_id }
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
      const insertPromises = studentList.map(studentId => 
        ClassroomStudents.create({
          f_classroom_id: Number(currentClassroom), 
          f_student_id: Number(studentId)
        })
      );
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


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
