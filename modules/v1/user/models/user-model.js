const common = require("../../../../utilities/common");
const database = require("../../../../config/database");
const response_code = require("../../../../utilities/response-error-code");
const md5 = require("md5");

class UserModel {
    
    async signup(request_data, callback) {
            // Insert new user if no existing record found
            try {
                if (!request_data.email_id || !request_data.user_name || !request_data.mobile_number || !request_data.passwords) {
                    return callback({
                        code: response_code.OPERATION_FAILED,
                        message: "Missing required fields"
                    });
                }
                     // Prepare user data object
                    const userData = {
                        user_name: request_data.user_name,
                        email_id: request_data.email_id || null,
                        mobile_number: request_data.mobile_number || null,
                        passwords: request_data.passwords ? md5(request_data.passwords) : null,
                        steps_: 1
                    };

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
                    device_token: request_data.device_token,
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
            const updateUserQuery = "UPDATE tbl_user SET steps_ = 2 WHERE user_id = ?";
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
        if (!request_data || !request_data.user_id) {
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Invalid request data"
            });
        }    
        try {
            // Fetch user data first to check OTP verification status
        const userResult = await common.getUserDetail(request_data.user_id);

        if (!userResult || userResult.length === 0) {
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "User not found"
            });
        }

        if (userResult[0].steps_ !== 2) {
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Please verify your OTP before updating your profile"
            });
        }

        // Prepare updated user data
        const user_data = {
            user_full_name: request_data.user_full_name,
            date_of_birth: request_data.date_of_birth,
            steps_: 3
        };

        // Update user profile
        const updatedUser = await common.updateUserInfo(request_data.user_id, user_data);

        callback({
            code: response_code.SUCCESS,
            message: "Profile updated successfully",
            user: updatedUser
        });
        } catch (error) {
            callback({
                code: response_code.OPERATION_FAILED,
                message: "Profile update failed"
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
            } else if (request_data.mobile_number) {
                field = 'mobile_number';
                email = request_data.mobile_number;
            } else {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Email or phone number is required"
                });
            }

            const selectQuery = `SELECT user_id, email_id, mobile_number FROM tbl_user WHERE ${field} = ?`;
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
                    message: "Password is required"
                });
            }                                         
            const passwordHash = md5(request_data.passwords || ""); // Hash the password
            const updateQuery = "UPDATE tbl_user SET passwords = ? WHERE user_id = ?";
            const [result] = await database.query(updateQuery, [passwordHash, request_data.user_id]);
            console.log("Update Query Result:", result);

            if (result.affectedRows === 0) {
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
            let field = 'email_id';
            let email = request_data.email_id;

            if (!email) {
                field = 'phone_number';
                email = request_data.phone_number;
            }

            const passwordHash = md5(request_data.passwords || ""); // Hash the password

            const selectQuery = `SELECT *, user_id FROM tbl_user WHERE ${field} = ? AND passwords = ?`;
            const condition = [email, passwordHash];

            console.log("Executing Query:", selectQuery);
            console.log("Query Parameters:", condition);

            // Execute the query
            const [result] = await database.query(selectQuery, condition);

            console.log("Query Result:", result);

            if (result.length > 0) {
                let user = result[0];

                if (user.is_active == 1) {
                    return callback({
                        code: response_code.SUCCESS,
                        message: "Login successful",
                        data: user
                    });
                } else {
                    return callback({
                        code: response_code.ACCOUNT_INACTIVE,
                        message: "Account is inactive"
                    });
                }
            } else {
                return callback({
                    code: response_code.INVALID_CREDENTIALS,
                    message: "Invalid email or password"
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

}
module.exports = new UserModel();
