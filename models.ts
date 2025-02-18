import { Sequelize, DataTypes, Model, Op } from 'sequelize';
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
  declare email: string;
  declare profilePicture: string | null;
  declare position: string ;
  declare isPending: boolean;
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
      unique: true,
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isPending: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    }
  },
  {
    sequelize,
    modelName: 'User',
  }
);
// Define Classroom model
class Classroom extends Model<InferAttributes<Classroom>, InferCreationAttributes<Classroom>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare teacher_id: string;
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
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: ProgUser,
        key: 'googleId',
      },
      onDelete: 'CASCADE'
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
  declare name: string;
  declare question: string;
  declare max_points: number;
  declare open: boolean;
  declare closeAt: string;
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    question: {
      type: DataTypes.STRING,
      allowNull:false
    },
    max_points: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    open: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    closeAt: {
      type: DataTypes.STRING, 
      allowNull: true, //When null that means open forever
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
  declare f_student_email: string;
  declare f_quiz_id: number;
  declare answer: string | null;
  declare answered: boolean;
  declare comment: string;
  declare graded: boolean;
  declare max_points: number
  declare points: number | null;
}
QuizStudent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    f_student_email: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: ProgUser,
        key: 'email',
      },
    onDelete: 'CASCADE'
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
    answered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: true
    },
    graded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    max_points: {
      type: DataTypes.INTEGER,
      allowNull: false
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
  declare f_student_email: string;
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
    f_student_email: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: ProgUser,
        key: 'email',
      },
      onDelete: 'CASCADE'
    },
  },
  {
    sequelize,
    modelName: 'ClassroomStudents',
  }
);

// Sync models with database
(async () => {
  try {
    await sequelize.query('PRAGMA foreign_keys = OFF');
    await sequelize.sync({ alter: true });
    await sequelize.query('PRAGMA foreign_keys = ON');
    console.log('Database & tables created!');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
})();

export { sequelize, Op, ProgUser, Classroom, Quiz, QuizStudent, ClassroomStudents };
