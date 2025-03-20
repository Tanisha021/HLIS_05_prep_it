// PLACE ORDER FLOW: 

// 1. First check the cart details if not present then show error msg
// 2. Get the cart details in array
// 3. Then make a entry in order table and mark the status as pending with filling the table data with available fields
// 4. By for each loop mark the entry in order_details table one by one with proper quantity and the product price 
// 5. And then insert the address 
// 6. Mark the order status as confirmed
// 7. Lastly remove the cart data

// this is my flow

// create table tbl_ingredients(
// 	ing_id bigint primary key auto_increment,
//     ingredient_name varchar(256),
//     image_name varchar(256),
//     is_active boolean default 1,
//     is_deleted boolean default 0,
//     created_at datetime default current_timestamp(),
//     updated_at datetime on update current_timestamp()
// );

// create table ing_item_rel(
// 	rel_id bigint primary key auto_increment,
//     ing_id bigint references tbl_ingredients(ing_id),
//     item_id bigint references tbl_item(item_id),
//     is_active boolean default 1,
//     is_deleted boolean default 0,
//     created_at datetime default current_timestamp(),
//     updated_at datetime on update current_timestamp()
// );

// create table tbl_order_(
// 	order_id bigint primary key auto_increment,
//     user_id bigint references tbl_user(user_id),
//     order_number bigint default 0,
//     sub_total decimal(10,2),
//     delivery_charges decimal(10,2),
//     grand_total decimal(10,2),
//     delivery_date datetime,
//     total_qty bigint,
//     status_ enum ('pending', 'confirmed', 'failed'),
//     payemnt_method enum ('Credit/Debit Card', 'UPI', 'COD'),
//     is_active bool default 1,
//     is_deleted bool default 0,
//     created_at timestamp default current_timestamp,
//     updated_at timestamp default current_timestamp on update current_timestamp
// );

// create table tbl_cart(
// 	cart_id bigint primary key auto_increment,
//     user_id bigint references tbl_user(user_id),
//     item_id bigint references tbl_item(item_id),
//     qty bigint default 1,	
//     is_active bool default 1,
//     is_deleted bool default 0,
//     created_at timestamp default current_timestamp,
//     updated_at timestamp default current_timestamp on update current_timestamp
// );

// create table tbl_order_details(
// 	id bigint primary key auto_increment,
//     order_id bigint references tbl_order_(order_id),
//     item_id bigint references tbl_item(item_id),
//     qty bigint default 1,
    
//     item_qty bigint default 1,
//     price decimal(10,2),
//     is_active bool default 1,
//     is_deleted bool default 0,
//     created_at timestamp default current_timestamp,
//     updated_at timestamp default current_timestamp on update current_timestamp
// );

// person can add number of ingredients too in cart for specific item how can i mangage that bcoz 
// create table tbl_ingredients(
// 	ing_id bigint primary key auto_increment,
//     ingredient_name varchar(256),
//     image_name varchar(256),
//     is_active boolean default 1,
//     is_deleted boolean default 0,
//     created_at datetime default current_timestamp(),
//     updated_at datetime on update current_timestamp()
// );

// create table ing_item_rel(
// 	rel_id bigint primary key auto_increment,
//     ing_id bigint references tbl_ingredients(ing_id),
//     item_id bigint references tbl_item(item_id),
//     is_active boolean default 1,
//     is_deleted boolean default 0,
//     created_at datetime default current_timestamp(),
//     updated_at datetime on update current_timestamp()
// );

// i have made 2 table in tbl_ing and ing_item_rel 

// give me a whole api to handle this scenario
// async place_order(request_data,user_id){
//     try{
//         const meals = request_data.meals;
//         const category = request_data.category;
        
//         const findSubscUser = `SELECT * from tbl_subsc_user where user_id = ? and expires_at > NOW() AND is_active = 1 AND is_deleted = 0`;
//         const [subscribers] = await database.query(findSubscUser, [user_id]);

//         if(subscribers.length === 0){
//             return callback(common.encrypt({
//                 code: response_code.OPERATION_FAILED,
//                 message: "You are not Subscribed... Please Subscribe !",
//                 data: subscribers
//             }));
//         }

//         if (!meals || meals.length === 0) {
//             return callback(common.encrypt({
//                 code: response_code.OPERATION_FAILED,
//                 message: "No meals provided to place order"
//             }));
//         }

//         const now = new Date();
//         const delivery_time_start = new Date(now.getTime() + 2 * 60 * 60 * 1000);;

//         const deliveryEndDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); 
//         const delivery_time_end = deliveryEndDate; 

//         const order_data = {
//             user_id: user_id,
//             delivery_id: request_data.delivery_id,
//             note: request_data.note || null,
//             status_: 'confirmed',
//             delivery_time_start: delivery_time_start,
//             delivery_time_end: delivery_time_end,
//             total_qty: 0
//         };

//         const [orderRes] = await database.query(`INSERT INTO tbl_order SET ?`, [order_data]);
//         const order_id = orderRes.insertId;
//         console.log(meals);
//         for (const meal of meals) {
//             console.log(meal);
//             const meal_data = {
//                 order_id: order_id,
//                 item_id: meal.item_id,
//                 qty: meal.qty || 1,
//                 category: category,
//                 user_id: user_id
//             };
//             await database.query(`INSERT INTO tbl_meal SET ?`, [meal_data]);
//         }

//         return {
//             code: response_code.SUCCESS,
//             message: "ORDER PLACED SUCCESSFULLY",
//             data: { order_id: order_id }
//         };

//     } catch (error) {
//         return {
//             code: response_code.OPERATION_FAILED,
//             message: "ERROR PLACING ORDER",
//             data: error.message
//         };
//     }
// }

// in this format i want the api do not include subs logic

// cl1p.net - The internet clipboard Login/Sign Up cl1p.net/bt2
// This cl1p will be deleted in in 1 day.Copy
// ===========================================
// next task tell me on bt3
// ===========================================


// async function place_order(request_data, user_id) {
//     try {
//         // Fetch cart details
//         const cartQuery = `SELECT * FROM tbl_cart WHERE user_id = ? AND is_active = 1 AND is_deleted = 0`;
//         const [cartItems] = await database.query(cartQuery, [user_id]);

//         if (!cartItems.length) {
//             return {
//                 code: response_code.OPERATION_FAILED,
//                 message: "Cart is empty. Please add items before placing an order."
//             };
//         }

//         let sub_total = 0;
//         let total_qty = 0;
//         let orderDetails = [];

//         for (const item of cartItems) {
//             const itemPriceQuery = `SELECT price FROM tbl_item WHERE item_id = ?`;
//             const [itemPriceRes] = await database.query(itemPriceQuery, [item.item_id]);
//             const itemPrice = itemPriceRes.length ? itemPriceRes[0].price : 0;

//             sub_total += itemPrice * item.qty;
//             total_qty += item.qty;

//             // Fetch ingredients for the item
//             const ingredientQuery = `SELECT ing_id FROM ing_item_rel WHERE item_id = ? AND is_active = 1 AND is_deleted = 0`;
//             const [ingredients] = await database.query(ingredientQuery, [item.item_id]);
//             const ing_ids = ingredients.map(ing => ing.ing_id);

//             orderDetails.push({
//                 item_id: item.item_id,
//                 qty: item.qty,
//                 price: itemPrice,
//                 ingredients: ing_ids
//             });
//         }

//         // Calculate grand total (adding delivery charges if applicable)
//         const delivery_charges = request_data.delivery_charges || 0;
//         const grand_total = sub_total + delivery_charges;

//         // Insert order
//         const orderData = {
//             user_id,
//             sub_total,
//             delivery_charges,
//             grand_total,
//             total_qty,
//             status_: 'pending',
//             payemnt_method: request_data.payment_method,
//         };

//         const [orderRes] = await database.query(`INSERT INTO tbl_order_ SET ?`, [orderData]);
//         const order_id = orderRes.insertId;

//         // Insert order details
//         for (const detail of orderDetails) {
//             const orderDetailData = {
//                 order_id,
//                 item_id: detail.item_id,
//                 qty: detail.qty,
//                 price: detail.price
//             };
//             const [orderDetailRes] = await database.query(`INSERT INTO tbl_order_details SET ?`, [orderDetailData]);
//             const orderDetailId = orderDetailRes.insertId;

//             // Insert order ingredients
//             for (const ing_id of detail.ingredients) {
//                 await database.query(`INSERT INTO tbl_order_ingredients (order_detail_id, ing_id) VALUES (?, ?)`, [orderDetailId, ing_id]);
//             }
//         }

//         // Insert delivery address
//         if (request_data.address) {
//             const addressData = {
//                 order_id,
//                 address: request_data.address,
//                 city: request_data.city,
//                 state: request_data.state,
//                 zip: request_data.zip
//             };
//             await database.query(`INSERT INTO tbl_order_address SET ?`, [addressData]);
//         }

//         // Mark order as confirmed
//         await database.query(`UPDATE tbl_order_ SET status_ = 'confirmed' WHERE order_id = ?`, [order_id]);

//         // Clear cart
//         await database.query(`DELETE FROM tbl_cart WHERE user_id = ?`, [user_id]);

//         return {
//             code: response_code.SUCCESS,
//             message: "Order placed successfully!",
//             data: { order_id }
//         };
//     } catch (error) {
//         return {
//             code: response_code.OPERATION_FAILED,
//             message: "Error placing order",
//             data: error.message
//         };
//     }
// }


// -----------------------------------------------
// async function place_order(request_data, user_id) {
//     try {
//         // Fetch cart details
//         const cartQuery = `SELECT * FROM tbl_cart WHERE user_id = ? AND is_active = 1 AND is_deleted = 0`;
//         const [cartItems] = await database.query(cartQuery, [user_id]);

//         if (!cartItems.length) {
//             return {
//                 code: response_code.OPERATION_FAILED,
//                 message: "Cart is empty. Please add items before placing an order."
//             };
//         }

//         let sub_total = 0;
//         let total_qty = 0;
//         let orderDetails = [];

//         for (const item of cartItems) {
//             const itemPriceQuery = `SELECT price FROM tbl_item WHERE item_id = ?`;
//             const [itemPriceRes] = await database.query(itemPriceQuery, [item.item_id]);
//             const itemPrice = itemPriceRes.length ? itemPriceRes[0].price : 0;

//             sub_total += itemPrice * item.qty;
//             total_qty += item.qty;

//             // Fetch ingredients for the item
//             const ingredientQuery = `SELECT ing_id FROM ing_item_rel WHERE item_id = ? AND is_active = 1 AND is_deleted = 0`;
//             const [ingredients] = await database.query(ingredientQuery, [item.item_id]);
//             const ing_ids = ingredients.map(ing => ing.ing_id);

//             orderDetails.push({
//                 item_id: item.item_id,
//                 qty: item.qty,
//                 price: itemPrice,
//                 ingredients: ing_ids
//             });
//         }

//         // Calculate grand total (adding delivery charges if applicable)
//         const delivery_charges = request_data.delivery_charges || 0;
//         const grand_total = sub_total + delivery_charges;

//         // Insert order
//         const orderData = {
//             user_id,
//             sub_total,
//             delivery_charges,
//             grand_total,
//             total_qty,
//             status_: 'pending',
//             payemnt_method: request_data.payment_method,
//         };

//         const [orderRes] = await database.query(`INSERT INTO tbl_order_ SET ?`, [orderData]);
//         const order_id = orderRes.insertId;

//         // Insert order details
//         for (const detail of orderDetails) {
//             const orderDetailData = {
//                 order_id,
//                 item_id: detail.item_id,
//                 qty: detail.qty,
//                 price: detail.price
//             };
//             const [orderDetailRes] = await database.query(`INSERT INTO tbl_order_details SET ?`, [orderDetailData]);
//             const orderDetailId = orderDetailRes.insertId;

//             // Insert order ingredients with user-defined quantity
//             for (const ing_id of detail.ingredients) {
//                 const ingredientQty = request_data.ingredients?.find(ing => ing.item_id === detail.item_id && ing.ing_id === ing_id)?.qty || 1;
//                 await database.query(`INSERT INTO tbl_order_ingredients (order_detail_id, ing_id, qty, user_id) VALUES (?, ?, ?, ?)`, [orderDetailId, ing_id, ingredientQty, user_id]);
//             }
//         }

//         // Insert delivery address
//         if (request_data.address) {
//             const addressData = {
//                 order_id,
//                 address: request_data.address,
//                 city: request_data.city,
//                 state: request_data.state,
//                 zip: request_data.zip
//             };
//             await database.query(`INSERT INTO tbl_order_address SET ?`, [addressData]);
//         }

//         // Mark order as confirmed
//         await database.query(`UPDATE tbl_order_ SET status_ = 'confirmed' WHERE order_id = ?`, [order_id]);

//         // Clear cart
//         await database.query(`DELETE FROM tbl_cart WHERE user_id = ?`, [user_id]);

//         return {
//             code: response_code.SUCCESS,
//             message: "Order placed successfully!",
//             data: { order_id }
//         };
//     } catch (error) {
//         return {
//             code: response_code.OPERATION_FAILED,
//             message: "Error placing order",
//             data: error.message
//         };
//     }
// }
// ----------------------------------------
// Postman 
// POST /place_order
// Headers
// {
//     "Content-Type": "application/json",
//     "Authorization": "Bearer YOUR_ACCESS_TOKEN"
// }
// // for (const ing_id of detail.ingredients) {
//                 //     const ingredientQty = request_data.ingredients?.find(ing => ing.item_id === detail.item_id && ing.ing_id === ing_id)?.qty || 1;
//                 //     console.log("ingredientQty",ingredientQty);
//                 //     await database.query(`INSERT INTO item_ingredient_qty (rel_in_qty, ing_id, qty, user_id) VALUES (?, ?, ?, ?)`, [orderDetailId, ing_id, ingredientQty, user_id]);
//                 // }
// Body raw json:
// {
//     "delivery_charges": 50,
//     "payment_method": "UPI",
//     "address": "123 Street, City",
//     "city": "New York",
//     "state": "NY",
//     "zip": "10001",
//     "ingredients": [
//         { "item_id": 1, "ing_id": 101, "qty": 2 },
//         { "item_id": 1, "ing_id": 102, "qty": 1 },
//         { "item_id": 2, "ing_id": 201, "qty": 3 }
//     ]
// }


// And response should be:
// {
//     "code": 200,
//     "message": "Order placed successfully!",
//     "data": {
//         "order_id": 12345
//     }
// }


