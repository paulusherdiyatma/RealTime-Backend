module.exports = function (Member) {
  /**
   * Create a new remote method
   */
  Member.remoteMethod(
    'enter',
    {
      description: 'sign in user with email address.',
      accepts: [
        { arg: 'options', type: 'object', required: true, http: { source: 'body' } }
      ],
      http: { verb: 'post', path: '/enter' }
    }
  );

  Member.remoteMethod(
    'verify-member',
    {
      description: 'verify email address & code',
      accepts: [
        { arg: 'options', type: 'object', required: true, http: { source: 'body' } }
      ],
      http: { verb: 'post', path: '/verify-member' }
    }
  );
  
  Member.remoteMethod(
    'updateInfo',
    {
      description: 'update member information',
      accepts: [
        { arg: 'options', type: 'object', required: true, http: { source: 'body' } }
      ],
      http: { verb: 'put', path: '/updateInfo' }
    }
  );


  /**
   * Before remote method
   */
  Member.beforeRemote('enter', function (context, userInstance, next) {
    var validator = require('validator');
    var shortid = require('shortid');
    shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');

    if (validator.isEmail(context.req.body.email)) {
      Member.find({ where: { email: context.req.body.email } }, function (err, findResults) {
        var code = shortid.generate();
        if (findResults.length > 0) {
          memberUser = findResults[0];
          //update member's code
          memberUser.updateAttribute('code', code, function (err, updateMemberResult) {
            sendCodeByEmail(context, code);
          });
        }
        //create a new member
        else {
          var newMember = {};
          newMember.email = context.req.body.email;
          newMember.code = code;
          Member.create(newMember, function (err, createMemberResult) {
            sendCodeByEmail(context, code);
          })
        }
      })
    }
    else {
      var error = {};
      error.name = 'BAD_REQUEST'
      error.status = 400;
      error.message = 'email is not valid';
      return next(error);
    }
  });

  Member.beforeRemote('verify-member', function (context, userInstance, next) {
    if (typeof (context.req.body.email) != 'undefined' && typeof (context.req.body.code) != 'undefined') {
      Member.find({ where: context.req.body }, function (err, findResult) {
        if (findResult.length > 0) {
          return context.res.status(200).send(findResult[0]);
        }
        else {
          var error = {};
          error.name = 'Unauthorized'
          error.status = 401;
          error.message = 'Code or email is not valid';
          return next(error);
        }

      })
    }
    else {
      var error = {};
      error.name = 'BAD_REQUEST'
      error.status = 400;
      error.message = 'Request is not valid';
      return next(error);
    }
  });
  
  Member.beforeRemote('**', function (context, userInstance, next) {
    if(context.methodString == 'member.upsert') {
      if(typeof(context.req.headers.authorization) != 'undefined'){
        Member.findOne({where:{code:context.req.headers.authorization}}, function(err, findResult){
          if(findResult !=null){
             findResult.updateAttributes(context.req.body,function(err, updateResult){
               return context.res.status(200).send(updateResult);
             });
          }
          else {
            var error = {};
          error.name = 'Unauthorized'
          error.status = 401;
          error.message = 'Code or email is not valid';
          return next(error);
          }
        })
      }
      else {
        var error = {};
          error.name = 'Unauthorized'
          error.status = 401;
          error.message = 'Code or email is not valid';
          return next(error);
      }
    }
  });
  

  function sendCodeByEmail(context, code) {
    Member.app.models.Email.send({
      to: context.req.body.email,
      from: 'noreplyestaytest@gmail.com',
      subject: 'auth code',
      text: code,
      html: code
    }, function (err, mail) {
      var response = {};
      response.message = 'Please check your email to get an auth code';
      return context.res.status(200).send(response);
    });
  }
};