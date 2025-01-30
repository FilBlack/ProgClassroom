import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import 'dotenv-esm/config';
import {sequelize, User} from './models.js'
type PassportUser = InstanceType<typeof User>;


const clientSecret: string = String(process.env.GOOGLE_CLIENT_SECRET);

passport.use(
    new GoogleStrategy(
    {
        clientID: '271759399576-itntdu7bjsl48t2ddpfia49tu0r75aqh.apps.googleusercontent.com',
        clientSecret: clientSecret,
        callbackURL: '/auth/google/callback',
        scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if the user already exists in the database
            let user: PassportUser | null = await User.findOne({ where: { googleId: profile.id } });

            if (!user) {
                // Create a new user if not found
                user = await User.create({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails?.[0].value || null,
                    profilePicture: profile.photos?.[0].value || null 
                });
            }
            const validUser: PassportUser = user;
            return done(null, user);  // Pass the user object to done
        } catch (err) { 
            return done(err);  // Pass the error to done in case of failure
        }
    })
);

// @ts-ignore
passport.serializeUser(((user: PassportUser, done: (err: any, id?: number) => void) => {
    done(null, user.id);  // Use type assertion
}));

passport.deserializeUser(async (id : number, done) => {
    try {
        const user : PassportUser | null = await User.findByPk(id);  // Retrieve the user by primary key
        done(null, user);  
    } catch (err) {
        done(err);
    }
});
