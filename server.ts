import 'dotenv/config'
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
import redis from 'redis'
import type {RedisClientType} from 'redis'
import {RedisStore} from "connect-redis"


//Declar the needed interfaces for the user and the express session
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

// Redis session storage
if (!(process.env.DEV === "true")) {
  // Create new redis client
  var redisClient: RedisClientType = redis.createClient({
    url: process.env.REDIS_ENDPOINT,
    password: process.env.REDIS_PASSWORD,
    socket: { tls: true, rejectUnauthorized: false }
  });
  
  // Attach extensive logging on Redis client events
  redisClient.on('connect', () => console.log('[Redis] Client connected.'));
  redisClient.on('ready', () => console.log('[Redis] Client ready to use.'));
  redisClient.on('reconnecting', () => console.log('[Redis] Reconnecting...'));
  redisClient.on('end', () => console.log('[Redis] Client connection closed.'));
  redisClient.on('error', (err) => console.error('[Redis] Client Error:', err));
  
  (async () => {
    console.log('[Redis] Attempting to connect...');
    try {
      await redisClient.connect();
      console.log('[Redis] Connected successfully.');
    } catch (err) {
      console.error('[Redis] Could not connect:', err);
    }
  })();
}

// Create the express app
const app: Express = express();
app.use(bodyParser.json());  // Parse JSON request bodies
app.use(cookieParser()); // Parse cookies

// Get the session secret from the environment
const sessionSecret: string = String(process.env.GOOGLE_CLIENT_SECRET);

// Check if we are in development or production, use either the basic express session or redis
if ((process.env.DEV === "true")) {
  app.use(session({
      secret: sessionSecret,
      resave: true,
      saveUninitialized: true
  }));

} else {
  app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: sessionSecret,
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 30, // Session expires after 30 minutes
    },
  }));
}

// Use passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// Google Authentication
app.get('/auth/google', (req: Request, res: Response, next: NextFunction) => {
    // Get the position of the user that is signing in, it is either 'student' or 'teacher'
    const position: string = String(req.query.position);
    if (position !== 'teacher' && position !== 'student') {
      res.status(400).json({ error: 'Invalid position' });  
    }

    if (!req.session) {
      res.status(500).json({ error: 'Session not initialized' });
    }
    // Save the position to session to be accessed by passport
    req.session.position = position;
    next();
    // Pass on to passport
  },passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Endpoint for the callback after authentication has completed
app.get('/auth/google/callback', 
  // Authenticate with passport
  passport.authenticate('google', { failureRedirect: '/' }),
  // Redirect to correct starting page according to position
  function(req, res) {
    if (req.user.position === 'teacher') {
      res.redirect('/teacher_classroom_list');
    } else {
      res.redirect('/student_classroom_list')
    }
  });


// Get classrooms by teacher to be used in endpoint
const getClassroomsByTeacher = async (teacherId: string) : Promise<Classroom[]> => {
  try {
    const classrooms : Classroom[] = await Classroom.findAll({
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

// Get all the classrooms by teacher
app.get('/getClassroomsByTeacher', async (req : Request, res :Response) => {
  // At the start of each endpoint we check authentication using the users cookie and serialised data
  if (req.user !== undefined && req.isAuthenticated()) {
    const teacherId: string = String(req.user.googleId);
  
    try {
      // Simply use the previous function
      const classrooms: Classroom[] = await getClassroomsByTeacher(teacherId);
      res.json(classrooms);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }

});

// Get all the classrooms by student email endpoint
app.get('/getClassroomsByStudent', async (req : Request, res :Response) => {
  if (req.user !== undefined && req.isAuthenticated()) {
    // We search based on the students email
    const studentEmail : string = String(req.user.email);
    try {
      // Get all the connections between student and classroom where the email matches
      const classroomStudents: ClassroomStudents[]= await ClassroomStudents.findAll({
        where: { f_student_email: studentEmail }
      });
      // Map the connections to the corresponding classroom id
      const classroomIds : number[] = classroomStudents.map(classroom => classroom.f_classroom_id);
      // Get all the classrooms based on their ids
      const classrooms: Classroom[] = await Promise.all(
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

// Function to get all the students in a classroom
const getStudentsByClassroom = async (classroomId: number): Promise<ProgUser[]> => {
  try {
    // Get all the connections between student and classroom where the provided classroom id matches
    const studentClassroomConnections: ClassroomStudents[] = await ClassroomStudents.findAll({
      where: {
        f_classroom_id: classroomId,
      },
    });
    // For each connection found, get the the corresponding student
    var students: ProgUser[] = [] 
    for (const connection of studentClassroomConnections) {
      let student : ProgUser[] = await ProgUser.findAll({
        where: { email: connection.f_student_email }
      });
      // If we managed to find one we return him 
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

// Endpoint to get all the students in a classroom by the classroom id 
app.get('/getStudentsByClassroom', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated()) {
    const classroomId: number = Number(req.query.classroomId);
  
    if (isNaN(classroomId)) {
      res.status(500).json({error: "We need a number"})
    }  
  
    try {
      const students : ProgUser[] = await getStudentsByClassroom(classroomId);
      res.json(students);
    } catch (error) {
      console.error('Error fetching students by classroom:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
});

// Endpoint to add students en masse to a classroom
app.post('/addStudentsToClassroom', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const studentList: string[] = req.body.studentList;
      const currentClassroom: string = req.body.currentClassroom
      // For each student we create a promise that we then execute 
      const insertPromises: Promise<void>[] = studentList.map(async studentEmail => {
        // If user does not already exist, create him
        const [user, created]: [ProgUser, {}] = await ProgUser.findOrCreate({
          where: { email: studentEmail, position: 'student' },
          defaults: {
            googleId: uuidv4(), // Chance of collision 1 in 2^212 apparently 
            name: 'Pending', 
            profilePicture: null,
            position: 'student',
            isPending: true,
          }
        });
        // Create the corresponding connection between studen and classroom
        await ClassroomStudents.create({
          f_classroom_id: Number(currentClassroom), 
          f_student_email: String(studentEmail)
        })
        // Get all the quizzes in the classsroom, since we need to assign them to the new student
        const quizzes: Quiz[] = await Quiz.findAll({
          where: {
            f_classroom_id : currentClassroom
          }
        }) 
        // For each quiz we create the corresponding connection with the student
        for (const quiz of quizzes) {
          let created: QuizStudent = await QuizStudent.create({
            f_student_email: studentEmail,
            f_quiz_id: quiz.id,
            answered: false,
            max_points: quiz.max_points
          }) 
        }
        
      });
      // Execute all the created promises
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

// Remove a student from a classroom endpoint
app.post ('/removeStudentFromClassroom', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const classroomId: number = req.body.classroomId;
      const studentEmail: string = req.body.studentEmail
      const studentId: string = req.body.studentId
      // Destroy the connection between the student and the classroom
      let destroyed: number = await ClassroomStudents.destroy({
        where: { f_classroom_id: classroomId, f_student_email: studentEmail},
      })
      if (destroyed) {
        // If wee succeed we find all the quizzes in the classroom, so that we can unassign them from the student
        const ClassroomQuizes = await Quiz.findAll(
          {where:{ f_classroom_id: classroomId }
        })
        // Delete all the connections between the quizzes in the classroom and the student being removed 
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

// Quiz section

// Get all the quizzes that a student has assigned within a specific classroom
app.get('/getQuizzesByStudentAndClassroom', async (req : Request, res :Response) => {
  if (req.user !== undefined && req.isAuthenticated()) {
    const currentClassroom : number = Number(req.query.currentClassroom)
    const studentEmail: string = String(req.user.email);
    try {
      // Find all the quiz connection that the student has
      const studentQuizzes: QuizStudent[] = await QuizStudent.findAll({
        where: { f_student_email: studentEmail }
      });
      // Map the quizzes that we found to their ids
      const quizIds: number[] = studentQuizzes.map(quizStudent => quizStudent.f_quiz_id);
      // Since we do not have information about the classroom withing the connection between a student and a quiz, we check each quiz if it is in the corresponding classroom 
      let quizzes: Quiz[] = await Promise.all(
        quizIds.map(f_quiz_id => Quiz.findOne({ where: { id: f_quiz_id, f_classroom_id: currentClassroom } }))
      );
      quizzes = quizzes.filter(quiz => quiz !== null);
      res.json(quizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }

});

// Get a single connection between a student and a quiz
app.get('/getQuizStudentConnection', async (req : Request, res :Response) => {
  if (req.user !== undefined && req.isAuthenticated()) {
    const studentEmail: string = req.query.studentEmail? String(req.query.studentEmail) : String(req.user.email)
    const quizId = Number(req.query.quizId)
    try {
      // Fin the corresponding connection between a student and a quiz based on the email and the quizId
      const studentQuizConnection: QuizStudent = await QuizStudent.findOne({
        where: { f_student_email: studentEmail, f_quiz_id: quizId }
      });

      res.json(studentQuizConnection);
    } catch (error) {
      console.error('Error fetching studentQuizConnection:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
});

// Get multiple quiz student connections based off of student email and array of quiz ids 
// We use this because when we have a quiz object and a student object, we need the corresponding information between them
app.get('/getQuizStudentConnectionsByQuizIds', async (req : Request, res :Response) => {
  if (req.user !== undefined && req.isAuthenticated()) {
    const studentEmail: string = String(req.user.email);
    const quizIdArray: number[] = String(req.query.quizIds).split(',').map(stringid => Number(stringid))
    try {
      // Get all the connections between the quizzes and the student s
      const connectionArray: QuizStudent[]= await Promise.all(
        quizIdArray.map(async (quizId) => {
          const studentQuizConnection: QuizStudent = await QuizStudent.findOne({
            where: { f_student_email: studentEmail, f_quiz_id: quizId }
          });
          return studentQuizConnection;
        })
      );
  
      res.json(connectionArray);
    } catch (error) {
      console.error('Error fetching studentQuizConnection:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
});

// Get multiple quiz student connection based off of quiz id and array of student emails
// Used to display all the students who have answered a quiz in the teacher section
app.get('/getQuizStudentConnectionsByStudentEmails', async (req : Request, res :Response) => {
  if (req.user !== undefined && req.isAuthenticated()) {
    const quizId: number = Number(req.query.quizId)
    const studentEmails: string[] = String(req.query.studentEmails).split(',')
    try {
      // Get all the corresponding connections
      const connectionArray: QuizStudent[] = await Promise.all(
        studentEmails.map(async (studentEmail) => {
          const studentQuizConnection: QuizStudent = await QuizStudent.findOne({
            where: { f_student_email: studentEmail, f_quiz_id: quizId }
          });
          return studentQuizConnection;
        })
      );

      res.json(connectionArray);
    } catch (error) {
      console.error('Error fetching studentQuizConnection:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
});

// Get a quiz object by its id
app.get('/getQuizById', async (req : Request, res :Response) => {
  if (req.user !== undefined && req.isAuthenticated()) {
    const quizId: number = Number(req.query.quizId);
    try {
      const quiz: Quiz = await Quiz.findOne({
        where: { id: quizId }
      });
      res.json(quiz);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
});

// Submit a student's answer to a quiz endpoint 
app.post('/submitQuizAnswer', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "student") {
    try {
      const studentEmail: string = String(req.user.email);
      const quizId: number = Number(req.body.quizId)
      const answerText: string = String(req.body.answerText) // The student's answer
      const [affectedCount] : [number] = await QuizStudent.update(
        {answered: true, answer: answerText},
        {where: { f_student_email: studentEmail, f_quiz_id: quizId} 
      });
      // If the update went through for one instance, it was successful
      if (affectedCount === 1) {
        res.status(201).json({ message: 'Submitted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to submit quiz' });
      }
    } catch (error) {
      console.error('Error submitting quiz', error);
      res.status(500).json({ error: 'Failed to submit' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
})

// Unsubmit a students answer endpoint
app.post('/unsubmitQuizAnswer', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "student") {
    try {
      const studentEmail: string = String(req.user.email);
      const quizId: number = Number(req.body.quizId)
      const [affectedCount] :[number] = await QuizStudent.update(
        {answered: false},
        {where: { f_student_email: studentEmail, f_quiz_id: quizId} 
      });
      // If the update went through for one instance, it was successful
      if (affectedCount === 1) {
        res.status(201).json({ message: 'Unsubmitted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to unsubmit quiz' });
      }
    } catch (error) {
      console.error('Error unsubmitting quiz', error);
      res.status(500).json({ error: 'Failed to unsubmit' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
})


// Submit a teacher's comment to a quiz endpoint 
app.post('/submitQuizComment', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const studentEmail: string = String(req.body.studentEmail);
      const quizId: number = Number(req.body.quizId)
      const commentText: string = String(req.body.commentText)
      const points: number = Number(req.body.points)
      const [affectedCount] :[number] = await QuizStudent.update(
        {graded: true, comment: commentText, points:points},
        {where: { f_student_email: studentEmail, f_quiz_id: quizId} 
      });
      // If the update affected one instance, it was successful
      if (affectedCount === 1) {
        res.status(201).json({ message: 'Submitted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to submit quiz' });
      }
    } catch (error) {
      console.error('Error submitting quiz', error);
      res.status(500).json({ error: 'Failed to submit' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
})

// Unsubmit a teacher's comment to a quiz endpoint
app.post('/unsubmitQuizComment', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const studentEmail: string = String(req.body.studentEmail);
      const quizId: number = Number(req.body.quizId)
      const [affectedCount] :[number] = await QuizStudent.update(
        {graded: false},
        {where: { f_student_email: studentEmail, f_quiz_id: quizId} 
      });
      // If the update affected one instance, it was successful
      if (affectedCount === 1) {
        res.status(201).json({ message: 'Unubmitted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to unsubmit quiz' });
      }
    } catch (error) {
      console.error('Error unsubmitting quiz', error);
      res.status(500).json({ error: 'Failed to unsubmit' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
})

//Classroom section

//Add a classroom endpoint
app.post('/addClassroom', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const classroomName: string = req.body.classroomString;
      const teacherId: string = req.user.googleId;
      // Creat a classroom based on the name provided by the teacher
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

// Remove a classroom based on the id endpoint
app.post ('/removeClassroom', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const classroomId: number = Number(req.body.classroomId);
      let destroyed: number = await Classroom.destroy({
        where: { id: classroomId },
      })
      if (destroyed) {
        // Destroy the quizzes associated with it 
        destroyed = await Quiz.destroy({where:
          {f_classroom_id:classroomId}
        })
        // Destroy the student connections associated with it
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

// Get Quizes in classroom by the classroom id  
const getQuizesByClassroom = async (classroomId: number): Promise<Quiz[]> => {
  try {
    const quizes : Quiz[]= await Quiz.findAll({
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

// Get Quizes in classroom by the classroom id endpoint
app.get('/getQuizesByClassroom', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated()) {
    const classroomId: number = Number(req.query.classroomId);
  
    if (isNaN(classroomId)) {
      res.status(500).json({error: "We need a number"})
    }  
  
    try {
      const quizzes: Quiz[] = await getQuizesByClassroom(classroomId);
      res.json(quizzes);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(403).json({error: "Unauthorized"})
  }
});

// Add a quiz to a classroom by the classroom id endpoint
app.post('/addQuizToClassroom', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const currentClassroom: number = Number(req.body.currentClassroom);
      const quizName: string = req.body.quizName;
      const quizQuestion: string = req.body.quizQuestion;
      const quizType: 'plaintext' | 'code' = req.body.quizType; // Two types of quizzes
      const closeAt : string= req.body.closeAt
      const maxPoints : number = Number(req.body.maxPoints)
      // Create the quiz 
      const createdQuiz = await Quiz.create({
        name: String(quizName), 
        question: String(quizQuestion),
        type: quizType,
        f_classroom_id: currentClassroom,
        closeAt: String(closeAt),
        open: true,
        max_points: maxPoints
      })
      // Find all the students in the classroom
      const students: ClassroomStudents[] = await ClassroomStudents.findAll({
        where: {
          f_classroom_id: currentClassroom
        }
      })
      // For each student in the classroom creata quiz student connection that assigns them the quiz
      for (const student of students) {
        await QuizStudent.create({
          f_quiz_id: createdQuiz.id,
          f_student_email: student.f_student_email,
          answered: false,
          max_points: maxPoints
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


// Remove a quiz from a classroom endpoint
app.post ('/removeQuiz', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const quizId: number = Number(req.body.quizId);
      let destroyed : number= await QuizStudent.destroy({
        where: {
          f_quiz_id:quizId
        }
      })
      
      if (destroyed) {
        // Destroy the quiz
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

// Close the quiz by its id endpoint 
app.post ('/closeQuiz', async (req: Request, res: Response) => {
  if (req.user !== undefined && req.isAuthenticated() && req.user.position === "teacher") {
    try {
      const quizId: number = Number(req.body.quizId)
      // Update the quiz open attribute
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

// Error logging for express
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Tell express to load the files from the client
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

//Schedule quiz closing, runs every minute to see if a quiz has been closed
cron.schedule('* * * * *', async () => {
  try {
    const nowISO: string = new Date().toISOString();
    // Update quizzes that are still open but whose closeAt timestamp has passed
    const [updatedCount] : [number] = await Quiz.update(
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
    if (updatedCount) {
      console.log(`Closed ${updatedCount} expired quizzes.`);
    }
  } catch (error) {
    console.error('Error closing expired quizzes:', error);
  }
});

// Set the port based on development or production
let port:number = Number(process.env.PORT) || 3000
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
