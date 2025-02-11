import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import 'dotenv-esm/config';
import {sequelize, ProgUser} from './models.js'
import { profileEnd } from 'node:console';
type PassportUser = InstanceType<typeof ProgUser>;


const clientSecret: string = String(process.env.GOOGLE_CLIENT_SECRET);

passport.use(
    new GoogleStrategy(
    {
        clientID: '271759399576-itntdu7bjsl48t2ddpfia49tu0r75aqh.apps.googleusercontent.com',
        clientSecret: clientSecret,
        callbackURL: '/auth/google/callback',
        passReqToCallback: true,
        scope: ['profile', 'email']
    },
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            // Check if the user already exists in the database
            if (req.session.position) {
                const profileEmail: string | null = profile.emails?.[0].value || null 
                if (profileEmail){
                    let user: PassportUser | null = await ProgUser.findOne({ where: { email: profileEmail} });
                    const position:string = req.session.position
                    if (!user) {
                        // Create a new user if not found 
                        user = await ProgUser.create({
                            googleId: profile.id,
                            name: profile.displayName,
                            email: profile.emails?.[0].value || null,
                            profilePicture: profile.photos?.[0].value || null,
                            position: position,
                            isPending: false,
                        });
                    } else if(user.isPending) {
                        //User exists but is pending, no need to update email
                        try {
                            user.googleId=  profile.id;
                            user.name = profile.displayName;
                            user.profilePicture = profile.photos?.[0].value || null;
                            user.position = position;
                            user.isPending = false;
                            await user.save()
                        } catch(err) {
                            return done(err)
                        }
                    };
                    return done(null, user);  // Pass the user object to done
                } else {
                    done("Need an email")
                }
            } else {
                return done("Position not found in session")
            }
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
        const user : PassportUser | null = await ProgUser.findByPk(id);  // Retrieve the user by primary key
        done(null, user);  
    } catch (err) {
        done(err);
    }
});
