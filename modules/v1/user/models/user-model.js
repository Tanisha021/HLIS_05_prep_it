const common = require("../../../../utilities/common");
const database = require("../../../../config/database");
const response_code = require("../../../../utilities/response-error-code");
const md5 = require("md5");
const {default: localizify} = require('localizify');
const { t } = require("localizify");
// const response_code=  require('../../../../utilities/response-error-code');

class UserModel {
    
    async getOrderDetails(request_data){
        try{
            const select_user_query = `SELECT 
                    GROUP_CONCAT(
                        CONCAT(d.area_name, ', ', d.flat_number, ', ', d.block_number, ', ', d.road_name, ', ', d.delivery_info, ', ', d.type_)
                        SEPARATOR ' , '
                    ) AS delivery_details,
                    o.delivery_time_start, 
                    o.delivery_time_end, 
                    i.item_name, 
                    m.quanitity, 
                    o.note, 
                    o.status_
                FROM tbl_user u 
                INNER JOIN tbl_order o ON o.user_id = u.user_id
                INNER JOIN tbl_meal m ON m.order_id = o.order_id
                INNER JOIN tbl_item_details i ON i.item_id = m.item_id
                INNER JOIN tbl_delivery_address d ON d.delivery_id = u.delivery_address 
                WHERE o.order_id = ?
                GROUP BY o.order_id, o.delivery_time_start, o.delivery_time_end, i.item_name, m.quanitity, o.note, o.status_;`;
            const [itemDetails] = await database.query(select_user_query, [request_data.order_id]);
            if(itemDetails.length>0){
                return {
                    code: response_code.SUCCESS,
                    message: "Order Details",
                    data: itemDetails
                };
            }else{
                return {
                    code: response_code.NOT_FOUND,
                    message: "Order not found"
                };
            }
        }catch(error){
            return {
                code: response_code.OPERATION_FAILED,
                message: t('some_error_occurred'),
                data: error
            };
        }
    }
    async getItemDetails(request_data){
        try{
            const select_user_query = `SELECT 
                itd.item_name,
                itd.kcal,
                itd.carbs,
                itd.protein,
                itd.fat,
                itd.desc_,
                i.image_name,
                GROUP_CONCAT(ing.name_) AS ingredients
            FROM tbl_item_details AS itd
            INNER JOIN tbl_rel_ingredient_item AS rinit ON itd.item_id = rinit.item_id
            INNER JOIN tbl_ingredients AS ing ON ing.ingredient_id = rinit.ingredient_id
            INNER JOIN tbl_images AS i ON i.image_id = itd.image_id
            WHERE itd.item_id = ?
            GROUP BY itd.item_id, itd.item_name, itd.kcal, itd.carbs, itd.protein, itd.fat, itd.desc_, i.image_name
        `;
            const [itemDetails] = await database.query(select_user_query, [request_data.item_id]);
            if(itemDetails.length>0){
                return {
                    code: response_code.SUCCESS,
                    message: "Item Details",
                    data: itemDetails
                };
            }else{
                return {
                    code: response_code.NOT_FOUND,
                    message: "Item not found"
                };
            }
        }catch(error){
            return {
                code: response_code.OPERATION_FAILED,
                message: t('some_error_occurred'),
                data: error
            };
        }
    }

    async addDeliveryAddress(request_data,user_id){
        try{
            const delivery_data = {
                latitude: request_data.latitude,
                longitude: request_data.longitude,
                area_name: request_data.area_name,
                flat_number: request_data.flat_number,
                block_number: request_data.block_number,
                road_name: request_data.road_name,
                delivery_info: request_data.delivery_info,
                type_: request_data.type_
            }

            const query = 'INSERT INTO tbl_delivery_address SET ?';
            const [res] = await database.query(query, [delivery_data]);
            const insertId = res.insertId;
            
            const update_user_info = `update tbl_user set delivery_address = ? where user_id = ?`;
            await database.query(update_user_info, [insertId, user_id]);
            
            return {
                code: response_code.SUCCESS,
                message: "SUCCESS"
            };

        }catch(error){
            return {
                code: response_code.OPERATION_FAILED,
                message: "ERROR",
                data: error.message
            };
        }
    }

    async help_support(request_data,user_id){
        try{
            const delivery_data = {
                user_id: user_id,
                full_name: request_data.full_name,
                phone_number: request_data.phone_number,
                email_id: request_data.email_id,
                descp: request_data.descp
            }

            const query = `INSERT INTO tbl_help_support SET ?`
            await database.query(query, [delivery_data]);
            return {
                code: response_code.SUCCESS,
                message: "SUCCESS"
            };

        }catch(error){
            return {
                code: response_code.OPERATION_FAILED,
                message: "ERROR",
                data: error.message
            };
        }
    }


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
