import { Router } from "express";
import passport from "passport";

const adminAuthRouter = Router();

adminAuthRouter.get(
  "/microsoft",
  passport.authenticate("auth-microsoft", {
    prompt: "select_account",
    session: false,
  }),
);

adminAuthRouter.get(
  "/microsoft/callback",
  passport.authenticate("auth-microsoft", {
    failureRedirect: "/auth/microsoft",
    session: false,
  }),
  (req, res) => {
    const userString = JSON.stringify(req.user);
    res.send(`
        <!DOCTYPE html>
        <html>
            <body>
            </body>
                <script>
                    window.opener.postMessage(${userString}, 'http://localhost:5173')
                </script>
        </html>
    `);
  },
);

export default adminAuthRouter;
