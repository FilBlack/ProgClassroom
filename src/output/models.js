import { Sequelize, DataTypes, Model } from 'sequelize';
// Initialize Sequelize instance
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite', // Path to SQLite database file
    logging: false,
});
// Define User model with proper types
class User extends Model {
}
User.init({
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
}, {
    sequelize,
    modelName: 'User',
});
// Define Teacher model
class Teacher extends Model {
}
Teacher.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    login: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    heslo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Teacher',
});
// Define Student model
class Student extends Model {
}
Student.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    login: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    heslo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Student',
});
// Define Classroom model
class Classroom extends Model {
}
Classroom.init({
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
}, {
    sequelize,
    modelName: 'Classroom',
});
// Define Quiz model
class Quiz extends Model {
}
Quiz.init({
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
}, {
    sequelize,
    modelName: 'Quiz',
});
// Define QuizStudent model
class QuizStudent extends Model {
}
QuizStudent.init({
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
}, {
    sequelize,
    modelName: 'QuizStudent',
});
// Define ClassroomStudents model
class ClassroomStudents extends Model {
}
ClassroomStudents.init({
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
}, {
    sequelize,
    modelName: 'ClassroomStudents',
});
// Sync models with database
sequelize.sync({ alter: true }).then(() => {
    console.log('Database & tables created!');
});
export { sequelize, User, Teacher, Student, Classroom, Quiz, QuizStudent, ClassroomStudents };
//# sourceMappingURL=models.js.map