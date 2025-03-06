const common = require("../../../../utilities/common");
const database = require("../../../../config/database");
const response_code = require("../../../../utilities/response-error-code");
const md5 = require("md5");
const {default: localizify} = require('localizify');
const { t } = require("localizify");


class UserModel {
    
    async signup(request_data, callback) {
            // Insert new user if no existing record found
            try {
                if (!request_data.email_id ) {
                    return callback({
                        code: response_code.OPERATION_FAILED,
                        message: "Missing required fields"
                    });
                }
                     // Prepare user data object
                    const userData = {
                        email_id: request_data.email_id || null,
                        phone_number: request_data.phone_number,
                        signup_type: request_data.signup_type || 'S', // 'S' for standard
                        passwords: request_data.passwords ? md5(request_data.passwords) : null,
                        social_id: request_data.social_id || null,
                        signup_type: request_data.social_type || null, // 'google' or 'facebook'
                        isstep_: 1
                    };
                    
                     // Check if user exists
                    const checkUserQuery = "SELECT * FROM tbl_user WHERE email_id = ? OR phone_number = ?";
                    const [existingUser] = await database.query(checkUserQuery, [request_data.email_id, request_data.phone_number]);

                    if (existingUser.length > 0) {
                        return callback({
                            code: response_code.OPERATION_FAILED,
                            message: "User already exists"
                        });
                    }

                const insertUserQuery = "INSERT INTO tbl_user SET ?";

                // Insert user into the database
                const [result] = await database.query(insertUserQuery, userData);
                console.log(result.insertId)
                if (!result.insertId) {
                    return callback({
                        code: response_code.OPERATION_FAILED,
                        message: "User registration failed"
                    }, null);
                } 
                const timeZoneTimestamp = new Date(request_data.time_zone).toISOString().slice(0, 19).replace('T', ' ');
                const deviceData = {
                    user_id: result.insertId,
                    device_type: request_data.device_type,
                    os_version: request_data.os_version,
                    app_version: request_data.app_version,
                    time_zone: timeZoneTimestamp
                };
                
                const insertDeviceQuery = "INSERT INTO tbl_device_info SET ?";
                await database.query(insertDeviceQuery, deviceData);

                callback({
                    code: response_code.SUCCESS,
                    message: "User registered, please verify OTP",
                    user_id: result.insertId
                });

            } catch (error) {
                console.error("Signup error:", error); // Log the actual error
                callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Signup error: " + error.message  // Include error message
                }, null);
            }
    }

    // verify OTP
    async verifyOTP(request_data, callback) {
        try {
            const generated_otp = common.generateOTP();
            console.log("Generated OTP:", generated_otp);
            const otp_data = {
                user_id: request_data.user_id,
                action: "signup",
                verify_with: request_data.email_id ? "email" : "phone",
                verify: 0,  // Not verified yet
                otp: generated_otp,
                created_at: new Date()
            };
            const insertOTPQuery = "INSERT INTO tbl_otp SET ?";
            console.log("Executing query:", insertOTPQuery, otp_data);

            const [result] = await database.query(insertOTPQuery, otp_data);

            console.log("Database Insert Result:", result);

            return callback({
                code: response_code.SUCCESS,
                message: "OTP sent successfully"
            }
            )
        } catch {
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "OTP generation error: "
            }, null);
        }
    };

    // OTP validation
    async validateOTP(request_data, callback) {
        try {
            const getOtpQuery = "SELECT otp FROM tbl_otp WHERE user_id = ?";
            const [otpResult] = await database.query(getOtpQuery, [request_data.user_id]);
            console.log("OTP Result:", otpResult);

            if (!otpResult || otpResult.length === 0) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "OTP not found"
                });
            }
            const storedOTP = otpResult[0].otp; // Extracting OTP value
            // Check if OTP matches
            if (storedOTP != request_data.otp) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "OTP incorrect"
                });
            }
            // mark OTP as verified
            const updateOtpQuery = "UPDATE tbl_otp SET verify = 1 WHERE user_id = ? and otp = ?";
            console.log("Executing Query:", updateOtpQuery);
            const [updateResult] = await database.query(updateOtpQuery, [request_data.user_id, request_data.otp]);
            console.log("Update Query Result:", updateResult);

            // Check if any row was affected
            if (updateResult.affectedRows === 0) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Failed to update OTP verification"
                });
            }
            callback({
                code: response_code.SUCCESS,
                message: "OTP verified successfully"
            });
        }
        catch {
            callback({
                code: response_code.OPERATION_FAILED,
                message: "OTP validation error: "
            }, null);
        }
    };

    async resendOTP(request_data, callback) {
        try {
           
            if (!request_data.email_id) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Email address is required"
                });
            }
    
            // Find user by email
            const checkUserQuery = "SELECT * FROM tbl_user WHERE email_id = ?";
            const [userResult] = await database.query(checkUserQuery, [request_data.email_id]);
            
            if (!userResult || userResult.length === 0) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "User not found with this email"
                });
            }
    
            const user_id = userResult[0].user_id;
            
            // Generate new OTP
            const generated_otp = common.generateOTP();
            console.log("Generated new OTP:", generated_otp);
    
            // Check if OTP record already exists for this user
            const checkOTPQuery = "SELECT * FROM tbl_otp WHERE user_id = ? AND action = 'signup'";
            const [existingOTP] = await database.query(checkOTPQuery, [user_id]);
    
            if (existingOTP && existingOTP.length > 0) {
                // Update existing OTP
                const updateOtpQuery = "UPDATE tbl_otp SET otp = ?, verify = 0, created_at = ? WHERE user_id = ? AND action = 'signup'";
                const [updateResult] = await database.query(updateOtpQuery, [
                    generated_otp, 
                    new Date(), 
                    user_id
                ]);
                
                console.log("Update OTP Result:", updateResult);
                
                if (updateResult.affectedRows === 0) {
                    return callback({
                        code: response_code.OPERATION_FAILED,
                        message: "Failed to update OTP"
                    });
                }
            } else {
                // Create new OTP record
                const otp_data = {
                    user_id: user_id,
                    action: "signup",
                    verify_with: "email",
                    verify: 0,
                    otp: generated_otp,
                    created_at: new Date()
                };
                
                const insertOtpQuery = "INSERT INTO tbl_otp SET ?";
                console.log("Executing insert query:", insertOtpQuery, otp_data);
                const [insertResult] = await database.query(insertOtpQuery, otp_data);
                
                console.log("Insert OTP Result:", insertResult);
                
                if (!insertResult || insertResult.affectedRows === 0) {
                    return callback({
                        code: response_code.OPERATION_FAILED,
                        message: "Failed to create new OTP"
                    });
                }
            }
            
            return callback({
                code: response_code.SUCCESS,
                message: "OTP resent successfully to your email"
            });
            
        } catch (error) {
            console.error("Error in resendOTP:", error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Error resending OTP: " + (error.message || error)
            });
        }
    }

    async checkUserVerification(request_data, callback) {
        try {
            const checkQuery = "SELECT verify FROM tbl_otp WHERE user_id = ?";
            const [otpResult] = await database.query(checkQuery, [request_data.user_id]);
            console.log("OTP Result:", otpResult);
            if (!otpResult || otpResult[0].verify != 1) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "User not verified"
                }, null);
            }
            const updateUserQuery = "UPDATE tbl_user SET isstep_ = '2' WHERE user_id = ?";
            const [result] = await database.query(updateUserQuery, [request_data.user_id]);
            console.log("Update Query Result:", result);
            callback({
                code: response_code.SUCCESS,
                message: "User is verified and can proceed"
            });
        } catch (error) {  // Fix: Added 'error' parameter
            console.error("Verification check failed:", error.message);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Verification check failed: " + error.message
            });
        }

    };

    async compeleteUserProfile(request_data, callback) {
        console.log("Request Data:", request_data);
        if (!request_data || !request_data.user_id) {
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Invalid request data"
            });
        }    
        try {
            // Fetch user data first to check OTP verification status
            
       await common.getUserDetail(request_data.user_id,async(err,userResult)=>{
        if (err || !userResult) {
            return callback({
                code: response_code.OPERATION_FAILED,
                message: t('user_not_found')
            });
        }

        console.log("User Result:", userResult);

        if (userResult.isstep_ !== '2') {
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Please verify your OTP before updating your profile"
            });
        }

        // Prepare updated user data
        const user_data = {
            user_name: request_data.user_name,
            fname: request_data.fname,
            lname: request_data.lname,
            address: request_data.address,
            dob: request_data.dob,
            gender: request_data.gender,
            isstep_: '3',
            profile_pic: request_data.profile_pic,
            is_profile_completed: 1  

        };


        try {
            // Update user profile
            const updatedUser = await common.updateUserInfo(request_data.user_id, user_data);
            console.log("Updated User:", updatedUser);
            
            // Insert user interests if provided and valid
            if (request_data.interests && request_data.interests.length > 0) {
                // Get interest IDs from names
                const interestQuery = "SELECT interest_id FROM tbl_interest WHERE interest_name IN (?)";
                const [validInterests] = await database.query(interestQuery, [request_data.interests]);

                if (validInterests.length > 0) {
                    const interestValues = validInterests.map(({ interest_id }) => `(${interest_id}, ${request_data.user_id})`).join(',');
                    const insertQuery = `INSERT INTO tbl_relation_interest_user (interest_id, user_id) VALUES ${interestValues}`;
                    await database.query(insertQuery);
                }
            }
            if (user_data.is_profile_completed === 1) {
                const userToken = common.generateToken(40);
                const deviceToken = common.generateToken(40);
    
                await Promise.all([
                    database.query("UPDATE tbl_user SET token = ? WHERE user_id = ?", [userToken, request_data.user_id]),
                    database.query("UPDATE tbl_device_info SET device_token = ? WHERE user_id = ?", [deviceToken, request_data.user_id])
                ]);
    
                updatedUser.token = userToken;
                updatedUser.device_token = deviceToken;
    
                return callback({  // Use callback here instead of direct return
                    code: response_code.SUCCESS,
                    message: "Profile updated successfully",
                    data: updatedUser
                });
            } 

            callback({
                code: response_code.SUCCESS,
                message: "Success, Verification Pending...",
                user: updatedUser
            });
        } catch (updateError) {
            callback({
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong') + updateError.message
            });
        }
    })
        } catch (error) {
            callback({
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong') + error.message
            }, null);
        }  
    }


    //forget password
    async forgotPassword(request_data, callback) {
        try {
            let field, email;

            // Determine whether to use email or phone number
            if (request_data.email_id) {
                field = 'email_id';
                email = request_data.email_id;
            } else if (request_data.phone_number) {
                field = 'phone_number';
                email = request_data.phone_number;
            } else {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Email or phone number is required"
                });
            }

            const selectQuery = `SELECT user_id, email_id, phone_number FROM tbl_user WHERE ${field} = ?`;
            // console.log("Executing Query:", selectQuery);
            // Execute the query
            const [result] = await database.query(selectQuery, [email]);
            console.log("Query Result:", result);
            const user = result[0];
            // Check if OTP matches
            // Verify email/phone matches the request
            if (field === 'email_id' && user.email_id !== request_data.email_id) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Email does not exist"
                });
            } else {
                callback({
                    code: response_code.SUCCESS,
                    message: "User registered, please verify OTP",
                    user_id: user.user_id
                });
            }

        } catch (error) {
            console.error("Database Error:", error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Database error occurred: " + (error.sqlMessage || error.message)
            });
        }
    }

    // reset Password - updated the tbl_user table with new password
    async resetPassword(request_data, callback) {
        try {
            if (!request_data.passwords) {
                return callback({
                    code: 400,
                    message: t("rest_keywords_password") + t("required")
                });
            }                                         
            const passwordHash = md5(request_data.passwords || ""); // Hash the password
            const updateQuery = "UPDATE tbl_user SET passwords = ? WHERE user_id = ?";
            const [result] = await database.query(updateQuery, [passwordHash, request_data.user_id]);
            console.log("Update Query Result:", result);

            if (result.affectedRows === 0) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    // "Failed to update password"
                    message: t("rest_password_reset_failed")
                });
            }
            callback({
                code: response_code.SUCCESS,
                // "Password updated successfully"
                message: t("rest_password_reset_success")
            });
        } catch (error) {
            console.error("Database Error:", error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Database error occurred: " + (error.sqlMessage || error.message)
            });
        }
    }

    async changePassword(request_data, callback) {
        try {
            let oldPassword = request_data.old_password; // Old password from user input
            let newPassword = request_data.new_password; // New password from user input

            // Hash the passwords
            const oldPasswordHash = md5(oldPassword || "");
            const newPasswordHash = md5(newPassword || "");

            const selectQuery = `SELECT passwords FROM tbl_user WHERE user_id = ?`;
            const [result] = await database.query(selectQuery, [request_data.user_id]);

            if (result[0].passwords !== oldPasswordHash) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Old password is incorrect"
                });
            }
            if (oldPasswordHash === newPasswordHash) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Old password and new password should not be same"
                });
            }
            const updateQuery = "UPDATE tbl_user SET passwords = ? WHERE user_id = ?";
            const [updateResult] = await database.query(updateQuery, [newPasswordHash, request_data.user_id]);
            // Check if the update was successful
            if (updateResult.affectedRows === 0) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Failed to update password"
                });
            }
            callback({
                code: response_code.SUCCESS,
                message: "Password updated successfully"
            });


        } catch (error) {
            console.error("Database Error:", error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Database error occurred: " + (error.sqlMessage || error.message)
            });
        }
    }

    // login
    async login(request_data, callback) {
        try {
            const user_data = {
                login_type: request_data.login_type
            };
            
            if(request_data.email_id != undefined && request_data.email_id != "") {
                user_data.email_id = request_data.email_id;
            }
            
            if(request_data.passwords != undefined) {
                user_data.passwords = md5(request_data.passwords);
            }
            
            if(request_data.social_id != undefined && request_data.social_id != "") {
                user_data.social_id = request_data.social_id;
            }
    
            let selectUserWithCred;
            let params;
    
            // Modified query to check directly in tbl_user without joining tbl_socials
            if(request_data.login_type == "S") {
                selectUserWithCred = "SELECT * FROM tbl_user WHERE email_id = ? AND passwords = ? AND signup_type = ?";
                params = [user_data.email_id, user_data.passwords, "S"];
            } else if(request_data.login_type == "G" || request_data.login_type == "F" || request_data.login_type == "A") {
                // For social logins, check directly in the tbl_user table
                selectUserWithCred = "SELECT * FROM tbl_user WHERE social_id = ? AND email_id = ? AND signup_type = ?";
                params = [user_data.social_id, user_data.email_id, user_data.login_type.toLowerCase()];
            } else {
                return callback({
                    code: response_code.INVALID_REQUEST,
                    message: "Invalid Login Type"
                });
            }
    
            const [status] = await database.query(selectUserWithCred, params);
            if (status.length === 0) {
                console.log("No user found");
                return callback({
                    code: response_code.NOT_FOUND,
                    message: t('no_data_found')
                });
            }
    
            const user_id = status[0].user_id;
    
            const token = common.generateToken(40);
            const updateTokenQuery = "UPDATE tbl_user SET token = ?, is_login = 1 WHERE user_id = ?";
            await database.query(updateTokenQuery, [token, user_id]);
    
            const device_token = common.generateToken(40);
            const updateDeviceToken = "UPDATE tbl_device_info SET device_token = ? WHERE user_id = ?";
            await database.query(updateDeviceToken, [device_token, user_id]);
    
            // Using await with a Promise wrapper instead of callback pattern for getUserDetailLogin
            const userInfo = await new Promise((resolve, reject) => {
                common.getUserDetailLogin(user_id, request_data.login_type, (err, userResult) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(userResult);
                    }
                });
            });
            
            userInfo.token = token;
            userInfo.device_token = device_token;
            
            return callback({
                code: response_code.SUCCESS,
                message: t('login_success'),
                data: userInfo
            });
        } catch (error) {
            console.error("Login error:", error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: error.sqlMessage || error.message
            });
        }
    }


}
module.exports = new UserModel();
