const Validator = require('Validator')
const {default: localizify} = require('localizify')
const en = require('../language/en.js')
const ar = require('../language/ar.js')
const hn = require('../language/hn.js')
const common = require('../utilities/common.js')
const {t} = require('localizify')
const response_code = require("../utilities/response-error-code");

const con = require('../config/database.js')

const middleware = {

    checkValidationRules:function(req,res,request,rules,message,keywords){
        console.log(request);
        console.log(rules);
        console.log(keywords)
        console.log('a')
        const v = Validator.make(request,rules,message,keywords);
        if(v.fails()){
            const errors = v.getErrors();
            console.log(errors);

            var error = "";
            for(var key in errors){
                error = errors[key][0];
                break;
            }
            console.log('c');
            
            response_data = {
                code:response_code.OPERATION_FAILED,
                message:error
            }
            console.log(response_data);
            
            // common.response(res, response_data);
            // res.status(200).send(response_data);
            res.send(common.encrypt(response_data));

            return false;
        }else{
            console.log('b')
            return true;
        }
    },

    send_response :function(req, res,code,message,data){
        console.log(req.lang);
        
        this.getMessage(req.lang,message,function(translated_message){
            console.log(translated_message);
            
            if (data == null) {
                response_data = {
                    code :code,
                    message:translated_message,
                    data: data 
                }
                
                res.status(200).send(response_data);
                // middleware.encryption(response_data,function(response){
                    // res.status(200);
                    // res.send(response);    
                // });
            
            } else {
                response_data = {
                    code :code,
                    message:translated_message,
                    data: data 
                }
                // middleware.encryption(response_data,function(response){
                    res.status(200).send(response_data);  
                // });
            }
        })
    },
    
    extractHeaderLanguage:function(req,res,callback){
        // return req.headers["accept-language"] || "en";
        var headerLang = req.headers['accept-language'] && req.headers['accept-language'].trim() !== ""
        ? req.headers['accept-language'] 
        : "en";  // Default to English if not provided
    
    req.lang = headerLang;

    // Assign the correct language object based on the header
    if (headerLang === 'en') {
        req.language = en;
    } else if (headerLang === 'ar') {
        req.language = ar;
    } else if (headerLang === 'hn') {  // Add Hindi support
        req.language = hn;
    } else {
        req.language = en; // Fallback to English if the language is unknown
    }

    // Add all language files to localizify
    localizify.add('en', en);
    localizify.add('ar', ar);
    localizify.add('hn', hn);  // Register Hindi language
    localizify.setLocale(req.lang);

    // // Handle decryption/encryption of request body if it exists
    // if (req.body && Object.keys(req.body).length > 0) {
    //     try{
    //         if(!req.body.headerLang){
    //             const req_body = JSON.parse(common.decryptPlain(req.body));
    //             console.log(req_body);
    //             req_body.headerLang = req.headerLang;
    //             req.body = common.encrypt(req_body);
    //             console.log("Req body: ", req.body);
    //         }
    //     }catch (error) {
    //         console.error("Error processing request body:", error);
    //         // Continue processing even if there's an error with the body
    //     }
    // }



    callback();
    }
}
module.exports = middleware;

