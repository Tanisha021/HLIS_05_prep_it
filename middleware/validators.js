const Validator = require('Validator')
const {default: localizify} = require('localizify')
const en = require('../language/en.js')
const ar = require('../language/ar.js')
const hn = require('../language/hn.js')
const {t} = require('localizify')

const con = require('../config/database.js')

const middleware = {

    checkValidationRules:function(req,res,request,rules,message,keywords){
        const v = Validator.make(request,rules,message,keywords);
        if(v.fails()){
            const errors = v.getErrors();
            console.log(errors);

            var error = "";
            for(var key in errors){
                error = errors[key][0];
                break;
            }
            response_data = {
                code:"0",
                message:error
            }

            // middleware(response_data,function(response){
                // res.status(200);
                // res.send(response);
            // });
            res.status(200).send(response_data);
            return false;
        }else{
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

    callback();
    }
}
module.exports = middleware;

