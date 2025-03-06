const common = require("../../../../utilities/common");
const database = require("../../../../config/database");
const response_code = require("../../../../utilities/response-error-code");
const md5 = require("md5");

class UserModel {
    
    async logout(request_data,callback){
        try{
            const select_user_query = "SELECT * FROM tbl_user WHERE user_id = ? and is_login = 1";
            const [info] = await database.query(select_user_query, [request_data.user_id]);
            if(info.length>0){
                const updatedUserQuery="update tbl_device_info set device_token = '', updated_at = NOW() where user_id = ?"
                const updatedTokenQuery="update tbl_user set token = '', is_login = 0 where user_id = ?"
            
            await Promise.all([
                database.query(updatedUserQuery, [user_id]),
                database.query(updatedTokenQuery, [user_id])
            ]);
        
            const getUserQuery = "SELECT * FROM tbl_user WHERE user_id = ?";
            const [updatedUser] = await database.query(getUserQuery, [user_id]);
    
            return callback({
                code: response_code.SUCCESS,
                message: t('logout_success'),
                data: updatedUser[0]
            });
        }else{
            return callback({
                code: response_code.NOT_FOUND,
                message: t('user_not_found_or_logged_out')
            });
        }
        }catch(error){
            return callback({
                code: response_code.OPERATION_FAILED,
                message: t('some_error_occurred'),
                data: error
            })
        }
    }

    async delete(request_data,user_id,callback){
        try{
            const selectQuery = "SELECT * FROM tbl_user WHERE user_id = ? and is_login = 1";
            const [info] = await database.query(selectQuery, [user_id]);
            if(info.length === 0){
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "User not found or not logged in"
                });
            }
            const selectUserQuery = "SELECT * FROM tbl_user WHERE user_id = ? AND is_deleted = 0";
            const [user] = await database.query(selectUserQuery, [user_id]);
    
            if (!user.length) {
                return callback({
                    code: response_code.NOT_FOUND,
                    message: t('user_already_deleted')
                });
            }
            const deleteQuery = "update tbl_user set is_deleted = 1,is_active =0,is_login=0 where user_id = ?"
            await database.query(deleteQuery, [user_id]);

            const deleteReviewQuery = "UPDATE tbl_ratings_review SET is_deleted = 1, is_active=0 WHERE user_id = ?";
            await database.query(deleteReviewQuery, [user_id]);
    
            const deleteFavSPQuery = "UPDATE tbl_user_fav_sp SET is_deleted = 1 WHERE user_id = ?";
            await database.query(deleteFavSPQuery, [user_id]);
    
            const deleteFavVoucherQuery = "UPDATE tbl_user_fav_voucher SET is_deleted = 1 WHERE user_id = ?";
            await database.query(deleteFavVoucherQuery, [user_id]);

        }catch (error) {
            console.log(error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: error
            });
        }
    }

}
module.exports = new UserModel();
