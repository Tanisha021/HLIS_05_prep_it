const express = require('express');
const app_routing = require('./modules/app-routing');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
const path = require("path");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
const common  = require('./utilities/common');


app.use('/',require('./middleware/validators').extractHeaderLanguage);
app_routing.v1(app); //router v1 ko call karega 

 

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port,()=>{
    console.log(`Server is running on port:${port}`);
})

// app.engine('html',require('ejs').renderFile);
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

// app.get('/listing', async (req,res)=>{
//     const [result]= await conn.query("select * from tbl_user where is_deleted=0");
//     console.log(result);
//                 if(result.length>0){
//                     res.render("listing",{data:result});
//                 }else{
//                     res.render("listing",{data:[]});
//                 }
// });