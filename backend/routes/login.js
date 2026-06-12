var express = require('express');
var router = express.Router();
const crypto = require('crypto'); // Native Library from Node to generate secure 6 digits numbers 100000 - 999999
const db = require('../models/cnx-db');
const LoginModel = require('../models/sql-login');
const MailerService = require('../services/mailer');


/* GET users listing. */
router.get('/:p_action', function(req, res, next) {
  res.render('login',{});
});

/* POST users listing. */
// Request code
router.post('/request-code/:p_action', async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.render('login', { toastKey: 'error_email_required', toastClass: 'toast text-bg-danger', showToast: true });
  }

  try {
    // Generate cripto number between 100000 y 999999
    const code = (crypto.randomInt(100000, 999999)).toString();

    /* Insert data using NOW() + INTERVAL 15 MINUTE -- SQL syntax with no model definitions
      const query = `INSERT INTO auth_codes (s_email, s_code, d_expires_at) 
        VALUES (?, ?, NOW() + INTERVAL 15 MINUTE)
      `;
      await db.execute(query, [email, code]);
    */

    // Zero SQL with model definitions
    await LoginModel.saveAuthCode(email, code);

    // STARTER-KIT: 
    // Nodemailer to send email.
    // For now, use the console to show code:
    await MailerService.sendVerificationCode(email, code, req.language);

    console.log(`\n============== [EMAIL SIMULATOR] ==============`);
    console.log(`To: ${email}`);
    console.log(`Subject: Your Verification Code`);
    console.log(`Code: ${code}`);
    console.log(`===============================================\n`);

    // Render view passing email to identify which email to verify
    res.render('verify-code', { 
      email: email, 
      toastKey: 'startToastMessage', // Message created
      toastClass: 'toast text-bg-success', 
      showToast: true 
    });

  } catch (error) {
    console.error('Error to generate crypto code:', error);
    next(error);
  }
});

// STEP 2: Verify code typed by user
router.post('/verify/:p_action', async (req, res, next) => {
  const { email, code } = req.body;

  try {
    /* Buscamos si el código coincide, no ha sido usado y no ha expirado -- sql with no model definitions
    const query = `
      SELECT * FROM auth_codes 
      WHERE s_email = ? 
        AND s_code = ? 
        AND b_used = 0 
        AND d_expires_at > NOW()
      ORDER BY d_created_at DESC 
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [email, code]);

    if (rows.length === 0) {
      // Code invalid or due
      return res.render('verify-code', { 
        email: email, 
        toastKey: 'invalidCodeError', 
        toastClass: 'toast text-bg-danger', 
        showToast: true 
      });
    } */

    // const matchedCodeRecord = rows[0];

    const matchedCodeRecord = await LoginModel.findValidCode(email, code);

    if (!matchedCodeRecord) {
      return res.render('verify-code', { 
        email: email, 
        toastKey: 'invalidCodeError', 
        toastClass: 'toast text-bg-danger', 
        showToast: true 
      });
    }


    // Update code as USED inmediately
    // await db.execute('UPDATE auth_codes SET b_used = 1 WHERE n_id = ?', [matchedCodeRecord.n_id]); -- SQL with no model definitions
    await LoginModel.markCodeAsUsed(matchedCodeRecord.n_id); // with model definitions

    // Verify if email exist as a permanent user 
    /* const [userRows] = await db.execute('SELECT * FROM users WHERE s_email = ?', [email]); -- SQL with no model definitions
    
    if (userRows.length === 0) {
      // If does not exist, Automaticaly registered (automatic Sign up)
      const insertUserQuery = 'INSERT INTO users (s_id, s_email) VALUES (UUID(), ?)';
      await db.execute(insertUserQuery, [email]);
      console.log(`[AUTH] New user registered automaticaly: ${email}`);
    } */

    let user = await LoginModel.findUserByEmail(email); // with model definitions

    if (!user) {
      // with model definitions
      user = await LoginModel.createNewUser(email);
      console.log(`[AUTH] New user registered automaticaly: ${email}`);
    }

    // SESSION START
    // Create an JWT or cookie for permanent session.
    // For now, sent it to index:
    req.session.user = { email: matchedCodeRecord.s_email };
    res.redirect('/index/start?lng=' + req.language);

  } catch (error) {
    console.error('Error to check code:', error);
    next(error);
  }
});

module.exports = router;
