import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { handler } from "./build/handler.js"
import express from 'express'
import session from 'express-session'
import passport from 'passport'
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser'; 
import { sequelize, Teacher, Student, Classroom, Quiz, QuizStudent, ClassroomStudents, ProgUser} from './models.js';
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
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/restricted', async (req : Request, res :Response) => {
  if (req.user !== undefined) {
    req.user.id
    req.user.googleId
  }

  
  try {

    if (req.isAuthenticated()) {
      res.status(200).json({msg: "You are authed"})
    }  
    else {
      res.status(200).json({msg: "You are not authed!!"})
    }
  
  } catch (error) {
    console.error('Error authing:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// get_classrooms endpoint
const getClassroomsByTeacher = async (teacherId: number) => {
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

    const teacherId = Number(req.user.googleId as string);
    if (isNaN(teacherId)) {
      res.status(500).json({error: "We need a number"})
    }  
  
    try {
      const classrooms = await getClassroomsByTeacher(teacherId);
      res.json(classrooms);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
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
  }
});
























app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.use(express.static('build/client'));

// Eats all the remaining routes
app.use(handler)

sequelize.sync().then(() => {
  app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
  });
});