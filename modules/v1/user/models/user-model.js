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
                    m.qty, 
                    o.note, 
                    o.status_
                FROM tbl_user u 
                INNER JOIN tbl_order o ON o.user_id = u.user_id
                INNER JOIN tbl_meal m ON m.order_id = o.order_id
                INNER JOIN tbl_item i ON i.item_id = m.item_id
                INNER JOIN tbl_delivery_address d ON d.delivery_id = u.delivery_address 
                WHERE o.order_id = ?
                GROUP BY o.order_id, o.delivery_time_start, o.delivery_time_end, i.item_name, m.qty, o.note, o.status_`;
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
            const select_user_query = `select  ing.ingredient_name ,i.image_name,itd.item_name,itd.kcal,itd.carbs,itd.protein,itd.fat,itd.about  
                            from tbl_item as itd
                            left join  ing_item_rel rinit on itd.item_id = rinit.item_id
                            left join tbl_ingredients ing on ing.ing_id= rinit.ing_id
                            left join tbl_images i on i.image_id = itd.image_id
                            where itd.item_id = ?`;
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

    async listNotifications(request_data,user_id){
        try{
            const query = `SELECT * from tbl_notification where user_id = ? `;
            const [notifications] = await database.query(query, [user_id]);
            console.log(notifications);
            
            if(notifications.length === 0){
                return {
                    code: response_code.NOT_FOUND,
                    message: "NO NOTIFICATION FOUND",
                    data: []
                };
            }

            return {
                code: response_code.SUCCESS,
                    message: "NOTIFICATIONS",
                    data: notifications
            };

        }catch(error){
            return {
                code: response_code.OPERATION_FAILED,
                message: "ERROR",
                data: error.message
            };
        }
    }

    async place_order(request_data,user_id){
        try{
            const meals = request_data.meals;
            const category = request_data.category;
            
            const findSubscUser = `SELECT * from tbl_subsc_user where user_id = ? and expires_at > NOW() AND is_active = 1 AND is_deleted = 0`;
            const [subscribers] = await database.query(findSubscUser, [user_id]);

            if(subscribers.length === 0){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: "You are not Subscribed... Please Subscribe !",
                    data: subscribers
                }));
            }

            if (!meals || meals.length === 0) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: "No meals provided to place order"
                }));
            }
    
            const now = new Date();
            const delivery_time_start = new Date(now.getTime() + 2 * 60 * 60 * 1000);;
    
            const deliveryEndDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); 
            const delivery_time_end = deliveryEndDate; 
    
            const order_data = {
                user_id: user_id,
                delivery_id: request_data.delivery_id,
                note: request_data.note || null,
                status_: 'confirmed',
                delivery_time_start: delivery_time_start,
                delivery_time_end: delivery_time_end,
                total_qty: 0
            };
    
            const [orderRes] = await database.query(`INSERT INTO tbl_order SET ?`, [order_data]);
            const order_id = orderRes.insertId;
            console.log(meals);
            for (const meal of meals) {
                console.log(meal);
                const meal_data = {
                    order_id: order_id,
                    item_id: meal.item_id,
                    qty: meal.qty || 1,
                    category: category,
                    user_id: user_id
                };
                await database.query(`INSERT INTO tbl_meal SET ?`, [meal_data]);
            }

            return {
                code: response_code.SUCCESS,
                message: "ORDER PLACED SUCCESSFULLY",
                data: { order_id: order_id }
            };
    
        } catch (error) {
            return {
                code: response_code.OPERATION_FAILED,
                message: "ERROR PLACING ORDER",
                data: error.message
            };
        }
    }

    async logout(request_data,user_id){
        try{
            const select_user_query = "SELECT * FROM tbl_user WHERE user_id = ? and is_login = 1";
            console.log(user_id)
            const [info] = await database.query(select_user_query, [user_id]);
            console.log(info);
            
            if(info.length>0){
                const updatedUserQuery="update tbl_device_info set device_token = '', updated_at = NOW() where user_id = ?"
                const updatedTokenQuery="update tbl_user set token = '', is_login = 0 where user_id = ?"
            
            await Promise.all([
                database.query(updatedUserQuery, [user_id]),
                database.query(updatedTokenQuery, [user_id])
            ]);
        
            const getUserQuery = "SELECT * FROM tbl_user WHERE user_id = ?";
            const [updatedUser] = await database.query(getUserQuery, [user_id]);
    
            return {
                code: response_code.SUCCESS,
                message: t('logout_success'),
                data: updatedUser[0]
            };
        }else{
            return {
                code: response_code.NOT_FOUND,
                message: t('user_not_found_or_logged_out')
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

    async delete(request_data,user_id){
        try{
            console.log(user_id);
            const queries = [
                `UPDATE tbl_user SET is_deleted = 1, is_active = 0, token = null, is_login = 0 WHERE user_id =${user_id}`,
                `UPDATE tbl_otp SET is_deleted = 1, is_active = 0, verify = 0 WHERE user_id = ${user_id}`,
                `UPDATE tbl_order SET is_deleted = 1, is_active = 0 WHERE user_id = ${user_id}`,
                `UPDATE tbl_meal SET is_deleted = 1, is_active = 0 WHERE user_id = ${user_id}`,
                `UPDATE tbl_device_info SET is_deleted = 1, is_active = 0 WHERE user_id = ${user_id}`,
                `UPDATE tbl_notification SET is_deleted = 1, is_active = 0 WHERE user_id = ${user_id}`,
                `UPDATE tbl_help_support SET is_deleted = 1, is_active = 0 WHERE user_id = ${user_id}`
            ];

            for (const query of queries) {
                await database.query(query, [user_id]);
            }

            return {
                code: response_code.SUCCESS,
                message: "ACCOUNT DELETED SUCCESSFULLY"
            };

        }catch (error) {
            console.log(user_id);
            console.log(error);
            return {
                code: response_code.OPERATION_FAILED,
                message: error
            };
        }
    }

}
module.exports = new UserModel();
