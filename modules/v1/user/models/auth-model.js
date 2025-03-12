const common = require("../../../../utilities/common");
const database = require("../../../../config/database");
const response_code = require("../../../../utilities/response-error-code");
const md5 = require("md5");
const {default: localizify} = require('localizify');
const { t } = require("localizify");


class UserModel {
    
    async signup(request_data, callback) {
        try {
            if (!request_data.email_id) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Missing required fields"
                });
            }
    
            const checkUserQuery = "SELECT * FROM tbl_user WHERE email_id = ? OR phone_number = ?";
            const [existingUser] = await database.query(checkUserQuery, [request_data.email_id, request_data.phone_number]);
    
            if (existingUser.length > 0) {
                const user = existingUser[0];
    
                // Reactivate the user if deleted and inactive
                if (user.is_deleted == 1 && user.is_active == 0) {
                    const updateUserQuery = "UPDATE tbl_user SET is_deleted = 0, is_active = 1 WHERE user_id = ?";
                    await database.query(updateUserQuery, [user.user_id]);
    
                    await common.updateOtp(user.user_id);
                    return callback({
                        code: response_code.SUCCESS,
                        message: "Account reactivated. OTP sent for verification."
                    });
                }
    
                // Check if the user is already verified
                const verifyQuery = "SELECT * FROM tbl_otp WHERE user_id = ? AND verify = 1";
                const [verifiedUser] = await database.query(verifyQuery, [user.user_id]);
    
                if (verifiedUser.length > 0) {
                    return callback({
                        code: response_code.OPERATION_FAILED,
                        message: "User already registered and verified, please login",
                        data: user
                    });
                }
    
                // User exists but is not verified, so update OTP
                await common.updateOtp(user.user_id);
                return callback({
                    code: response_code.SUCCESS,
                    message: "OTP updated for verification."
                });
            }
    
            // User does not exist → Insert new user
            const userData = {
                user_name: request_data.user_name,
                email_id: request_data.email_id || null,
                phone_number: request_data.phone_number,
                code_id: request_data.code_id,
                password_: request_data.password_ ? md5(request_data.password_) : null,
                isstep_: '1',
                is_deleted: 0,
                is_active: 1
            };
    
            const insertUserQuery = "INSERT INTO tbl_user SET ?";
            const [result] = await database.query(insertUserQuery, userData);
    
            if (!result.insertId) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "User registration failed"
                });
            }
    
            const userId = result.insertId;
    
            // Insert device info if provided
            if (request_data.device_type || request_data.os_version || request_data.app_version) {
                const deviceData = {
                    user_id: userId,
                    device_type: request_data.device_type,
                    os_version: request_data.os_version,
                    app_version: request_data.app_version,
                    time_zone: new Date(request_data.time_zone).toISOString().slice(0, 19).replace('T', ' ')
                };
                await database.query("INSERT INTO tbl_device_info SET ?", deviceData);
            }
    
            // Generate and store OTP for the new user
            const generated_otp = common.generateOTP();
            console.log("Generated OTP:", generated_otp);
    
            const otp_data = {
                user_id: userId,
                action: "signup",
                verify_with: request_data.email_id ? "email" : "phone",
                verify: 0,  // Not verified yet
                otp: generated_otp,
                created_at: new Date()
            };
    
            const insertOTPQuery = "INSERT INTO tbl_otp SET ?";
            console.log("Executing query:", insertOTPQuery, otp_data);
            await database.query(insertOTPQuery, otp_data);
    
            return callback({
                code: response_code.SUCCESS,
                message: "User registered, please verify OTP",
                user_id: userId
            });
    
        } catch (error) {
            console.error("Signup error:", error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Signup error: " + error.message
            });
        }
    }
    
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

            // Generate tokens here - BEFORE you use them
                const userToken = common.generateToken(40);
                const deviceToken = common.generateToken(40);

           // Update user and device tables with the generated tokens
                await Promise.all([
                    database.query("UPDATE tbl_user SET isstep_ = '2', token = ? WHERE user_id = ?", [userToken, request_data.user_id]),
                    database.query("UPDATE tbl_device_info SET device_token = ? WHERE user_id = ?", [deviceToken, request_data.user_id])
                ]);
                
                // Return success with tokens
                return callback({
                    code: response_code.SUCCESS,
                    message: "OTP verified successfully",
                    data: {
                        token: userToken,
                        device_token: deviceToken
                    }
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

    async completeUserProfile(request_data,user_id, callback) {
        console.log("Request Data:", request_data);
        // console.log("User ID:", user_id);
        if (!request_data ) {
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Invalid request data"
            });
        }    
        try {
            
            await common.getUserDetail(user_id, async(err, userResult) => {
                if (err || !userResult) {
                    return callback({
                        code: response_code.OPERATION_FAILED,
                        message: t('user_not_found')
                    });
                }
    
                console.log("User Result:", userResult);
                // Step-by-step verification
                if (parseInt(userResult.isstep_) < 2) {
                    return callback({
                        code: response_code.OPERATION_FAILED,
                        message: "Please verify your OTP before updating your profile."
                    });
                }
    
                let updatedData = {};
                let nextStep = parseInt(userResult.isstep_);  // Convert to number
    
                console.log("Current step (as number):", nextStep);
    
                // Compare with numbers, not strings
                if(nextStep === 2){
                    if (!request_data.latitude || !request_data.longitude) {
                        return callback({
                            code: response_code.OPERATION_FAILED,
                            message: "Please provide latitude and longitude."
                        });
                    }
                    // Debug the values being set
                    console.log("Setting latitude:", request_data.latitude);
                    console.log("Setting longitude:", request_data.longitude);
    
                    updatedData = {
                        latitude: request_data.latitude,
                        longitude: request_data.longitude,
                        isstep_: '3'
                    };
                    nextStep = 3;
                }else if(nextStep === 3){
                    if (!request_data.goal_id) {
                        return callback({
                            code: response_code.OPERATION_FAILED,
                            message: "Please provide a fitness goal."
                        });
                    }
                    updatedData = {
                        goal_id: request_data.goal_id,
                        isstep_: '4'
                    };
                    nextStep = 4;
                }else if(nextStep === 4){
                    if (!request_data.gender || !request_data.current_weight_kg || 
                        !request_data.target_weight_kg || !request_data.current_height_cm || 
                        !request_data.activity_level) {
                        return callback({
                            code: response_code.OPERATION_FAILED,
                            message: "Please provide all required profile details."
                        });
                    }
    
                    updatedData = {
                        gender: request_data.gender,
                        current_weight_kg: request_data.current_weight_kg,
                        target_weight_kg: request_data.target_weight_kg,
                        current_height_cm: request_data.current_height_cm,
                        activity_level: request_data.activity_level,
                        isstep_: '5',
                        is_profile_completed: 1
                    };
                    nextStep = 5;
                }
                // Debug before update
                console.log("Data to update:", updatedData);
                console.log("Updated data keys length:", Object.keys(updatedData).length);
                
                // Check if we have data to update
                if (Object.keys(updatedData).length === 0) {
                    return callback({
                        code: response_code.OPERATION_FAILED,
                        message: "No data to update for current step."
                    });
                }
                try {
                    // Update user information
                    const updatedUser = await common.updateUserInfo(user_id, updatedData);
                    
                    if (!updatedUser) {
                        return callback({
                            code: response_code.OPERATION_FAILED,
                            message: "Failed to update user profile."
                        });
                    }
    
                    // Return appropriate success message based on step
                    const isProfileCompleted = nextStep === 5;
                    const successMessage = isProfileCompleted ? 
                        "Profile completed successfully." : 
                        "Step completed successfully.";
                    
                    return callback({
                        code: response_code.SUCCESS,
                        message: successMessage,
                        // nextStep: nextStep,
                        // isProfileCompleted: isProfileCompleted
                    });
                } catch (updateError) {
                    return callback({
                        code: response_code.OPERATION_FAILED,
                        message: "Error updating user profile: " + updateError.message
                    });
                }
            });
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
    async resetPassword(request_data) {
        try {
            if (!request_data.password_) {
                return {
                    code: 400,
                    message: t("rest_keywords_password") + t("required")
                };
            }                                         
            const passwordHash = md5(request_data.password_ || ""); // Hash the password
            const updateQuery = "UPDATE tbl_user SET password_ = ? WHERE user_id = ?";
            const [result] = await database.query(updateQuery, [passwordHash, request_data.user_id]);
            console.log("Update Query Result:", result);

            if (result.affectedRows === 0) {
                // return callback({
                //     code: response_code.OPERATION_FAILED,
                //     // "Failed to update password"
                //     message: t("rest_password_reset_failed")
                // });
                return {
                    code: response_code.OPERATION_FAILED,
                    message: t("rest_password_reset_failed")
                };
            }
            // callback({
            //     code: response_code.SUCCESS,
            //     // "Password updated successfully"
            //     message: t("rest_password_reset_success")
            // });
            return {
                code: response_code.SUCCESS,
                message: t("rest_password_reset_success")
            };
        } catch (error) {
            console.error("Database Error:", error);
            // return callback({
            //     code: response_code.OPERATION_FAILED,
            //     message: "Database error occurred: " + (error.sqlMessage || error.message)
            // });
            return {
                code: response_code.OPERATION_FAILED,
                message: "Database error occurred: " + (error.sqlMessage || error.message)
            };
        }
    }

    async changePassword(request_data,user_id) {
        console.log("USER ID:", user_id);
        try {
            let oldPassword = request_data.old_password; // Old password from user input
            let newPassword = request_data.new_password; // New password from user input

            // Hash the passwords
            const oldPasswordHash = md5(oldPassword || "");
            const newPasswordHash = md5(newPassword || "");

            const selectQuery = `SELECT password_ FROM tbl_user WHERE user_id = ${user_id}`;
            const [result] = await database.query(selectQuery);

            if (result[0].password_ !== oldPasswordHash) {
                return {
                    code: response_code.OPERATION_FAILED,
                    message: "Old password is incorrect"
                };
            }
            if (oldPasswordHash === newPasswordHash) {
                return {
                    code: response_code.OPERATION_FAILED,
                    message: "Old password and new password should not be same"
                };
            }
            const updateQuery = `UPDATE tbl_user SET password_ = ? WHERE user_id = ${user_id}`;
            const [updateResult] = await database.query(updateQuery, [newPasswordHash]);
            // Check if the update was successful
            if (updateResult.affectedRows === 0) {
                return {
                    code: response_code.OPERATION_FAILED,
                    message: "Failed to update password"
                };
            }
           return {
                code: response_code.SUCCESS,
                message: "Password updated successfully"
            };


        } catch (error) {
            console.error("Database Error:", error);
            return {
                code: response_code.OPERATION_FAILED,
                message: "Database error occurred: " + (error.sqlMessage || error.message)
            };
        }
    }

    // login
    async login(request_data) {
        try {
            
            if (!request_data.email_id || !request_data.password_) {
                return {
                    code: response_code.BAD_REQUEST,
                    message: "Email and password are required"
                };
            }
            
            const passwordHash = md5(request_data.password_);
    
                // Query the user from the database
            const selectUserWithCred = "SELECT * FROM tbl_user WHERE email_id = ? AND password_ = ?";
            const [status] = await database.query(selectUserWithCred, [request_data.email_id, passwordHash]);

            // If no user found
            if (status.length === 0) {
                console.log("No user found");
                return {
                    code: response_code.NOT_FOUND,
                    message: t('no_data_found')
                };
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
            
            return {
                code: response_code.SUCCESS,
                message: t('login_success'),
                data: userInfo
            };
        } catch (error) {
            console.error("Login error:", error);
            return {
                code: response_code.OPERATION_FAILED,
                message: error.sqlMessage || error.message
            };
        }
    }


}
module.exports = new UserModel();
