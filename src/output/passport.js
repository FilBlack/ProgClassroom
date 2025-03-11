import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import 'dotenv-esm/config';
import { sequelize, ProgUser } from './models.js';
import { profileEnd } from 'node:console';
import { BOOLEAN } from 'sequelize';
const clientSecret = String(process.env.GOOGLE_CLIENT_SECRET);
const isDev = (process.env.DEV === "true");
console.log("IN Passport isDev:");
console.log(isDev);
passport.use(new GoogleStrategy({
    clientID: '271759399576-itntdu7bjsl48t2ddpfia49tu0r75aqh.apps.googleusercontent.com',
    clientSecret: clientSecret,
    callbackURL: isDev ? 'http://localhost:5173/auth/google/callback' : '/auth/google/callback',
    proxy: true,
    passReqToCallback: true,
    scope: ['profile', 'email']
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        if (req.session.position) {
            const profileEmail = profile.emails?.[0].value || null; // Parse the users email
            if (profileEmail) {
                let user = await ProgUser.findOne({ where: { email: profileEmail } });
                const position = req.session.position;
                /** Check if the user already exists in the database */
                if (!user) {
                    /** Create a new user if not found  */
                    user = await ProgUser.create({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails?.[0].value || null,
                        profilePicture: profile.photos?.[0].value || null,
                        position: position,
                        isPending: false,
                    });
                }
                else if (user.position !== position) {
                    /** User is loggin in as a different role  */
                    return done("User already registered with different role");
                }
                else if (user.isPending) {
                    /** User exists but is pending, no need to update email */
                    try {
                        user.googleId = profile.id;
                        user.name = profile.displayName;
                        user.profilePicture = profile.photos?.[0].value || null;
                        user.position = position;
                        user.isPending = false;
                        await user.save();
                    }
                    catch (err) {
                        return done(err);
                    }
                }
                ;
                return done(null, user); // Pass the user object to done
            }
            else {
                return done("Need an email");
            }
        }
        else {
            return done("Position not found in session");
        }
    }
    catch (err) {
        return done(err); // Pass the error to done in case of failure
    }
}));
/** Serialize the user for later use  */
passport.serializeUser(((user, done) => {
    done(null, user.id);
}));
/** Deseralize the user */
passport.deserializeUser(async (id, done) => {
    try {
        const user = await ProgUser.findByPk(id); // Retrieve the user by primary key
        done(null, user);
    }
    catch (err) {
        done(err);
    }
});
//# sourceMappingURL=passport.js.map