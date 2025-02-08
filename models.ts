import { Sequelize, DataTypes, Model } from 'sequelize';
import type {InferAttributes, InferCreationAttributes, CreationOptional} from 'sequelize'
// Initialize Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // Path to SQLite database file
  logging: false,
});

// Define User model with proper types
class ProgUser extends Model<InferAttributes<ProgUser>, InferCreationAttributes<ProgUser>> {
  declare id: CreationOptional<number>; // Auto-incremented ID
  declare googleId: string;
  declare name: string;
  declare email: string | null;
  declare profilePicture: string | null;
  declare position: string 
}
ProgUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    sequelize,
    modelName: 'User',
  }
);

class Teacher extends Model<InferAttributes<Teacher>, InferCreationAttributes<Teacher>> {
  declare id: CreationOptional<number>;
  declare googleId: string;
  declare name: string;
  declare email: string | null;
  declare profilePicture: string | null;
}

Teacher.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Teacher',
  }
);

// Define Student model with the same structure as ProgUser
class Student extends Model<InferAttributes<Student>, InferCreationAttributes<Student>> {
  declare id: CreationOptional<number>;
  declare googleId: string;
  declare name: string;
  declare email: string | null;
  declare profilePicture: string | null;
}

Student.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Student',
  }
);

// Define Classroom model
class Classroom extends Model<InferAttributes<Classroom>, InferCreationAttributes<Classroom>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare teacher_id: number;
}
Classroom.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Teacher,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Classroom',
  }
);

// Define Quiz model
class Quiz extends Model<InferAttributes<Quiz>, InferCreationAttributes<Quiz>> {
  declare id: CreationOptional<number>;
  declare f_classroom_id: number;
  declare open: boolean;
  declare type: 'plaintext' | 'code';
}
Quiz.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    f_classroom_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Classroom,
        key: 'id',
      },
    },
    open: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('plaintext', 'code'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Quiz',
  }
);

// Define QuizStudent model
class QuizStudent extends Model<InferAttributes<QuizStudent>, InferCreationAttributes<QuizStudent>> {
  declare id: CreationOptional<number>;
  declare f_student_id: number;
  declare f_quiz_id: number;
  declare answer: string | null;
  declare points: number | null;
}
QuizStudent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    f_student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Student,
        key: 'id',
      },
    },
    f_quiz_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Quiz,
        key: 'id',
      },
    },
    answer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'QuizStudent',
  }
);

// Define ClassroomStudents model
class ClassroomStudents extends Model<InferAttributes<ClassroomStudents>, InferCreationAttributes<ClassroomStudents>> {
  declare id: CreationOptional<number>;
  declare f_classroom_id: number;
  declare f_student_id: number;
}
ClassroomStudents.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    f_classroom_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Classroom,
        key: 'id',
      },
    },
    f_student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Student,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'ClassroomStudents',
  }
);

// Sync models with database
sequelize.sync({ alter: true }).then(() => {
  console.log('Database & tables created!');
});

export { sequelize, ProgUser, Teacher, Student, Classroom, Quiz, QuizStudent, ClassroomStudents };
