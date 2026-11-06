
const jwt = require("jsonwebtoken");

const adminAuthMiddleware = (req, res, next) => {
  console.log("inside authentication middleware");

  const token = req.headers["authorization"]?.split(" ")[1];

  console.log(token);

  if (token) {
    try {
      const jwtResponse = jwt.verify(token, process.env.JWTSECRET);

      console.log(jwtResponse);

      req.payload = jwtResponse.userEmail;
      const role = jwtResponse.role;

      if (role == "admin") {
 next()}
else {
        res.status(401).json("Authorization failed....un-authorizes access");
      }
    } catch (err) {
      res.status(401).json("Invalid token...please login");
    }
  } else {
    res.status(401).json("Authorization failed...token is missing");
  }
};

module.exports = adminAuthMiddleware;
