var express = require('express');
var router = express.Router();



const adminHelpers=require('../helpers/admin-helpers')
const productHelpers=require('../helpers/product-helpers')


const verifyLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn){
      next()
  }else{
      res.redirect('/admin/login')
  }
}


/* GET users listing. */
router.get('/',function(req, res, next) {

if(req.session.adminLoggedIn){
  res.render('admin/index',{admin:true}); 
}
else{
  res.redirect('admin/login')
}
 
});


//admin login--------------------------------------

router.get('/login', (req,res)=>{
if(!req.session.adminLoggedIn){
  res.render('admin/login',{admin:true,"loginErr":req.session.adminloginErr})
  req.session.userloginErr=null;
  
}
else{
  res.redirect('/admin')
}
})



router.post('/login',(req,res)=>{
console.log(req.body)
adminHelpers.doLogin(req.body).then((response)=>{

      if(response.status){
          req.session.admin=response.admin
          console.log(response.admin);
          req.session.adminLoggedIn=true
          res.redirect('/admin')
      }else{
          req.session.adminloginErr=response.error
          res.redirect('/admin/login')
      }
  })
})

router.get('/admin-dashboard',(req,res)=>{
  res.render('admin/admin-dashboard',{admin:true})
})


router.get('/product-add',(req,res)=>{
  res.render('admin/products-add',{admin:true})
})

router.post('/products-add',(req,res)=>{
  console.log(req.body)
  console.log(req.files.Image1)
  
  productHelpers.addProduct(req.body,(id)=>{
    let image=req.files.Image1
    image.mv('./public/product-images/'+id+'1'+'.jpg',(err,done)=>{
      if(err){
        console.log(err)
      }
      
    })
  
    image=req.files.Image2
    image.mv('./public/product-images/'+id+'2'+'.jpg',(err,done)=>{
      if(err){ 
        console.log(err)
      }    
    })
    image=req.files.Image3
    image.mv('./public/product-images/'+id+'3'+'.jpg',(err,done)=>{
      if(!err){
        console.log("iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii");
        res.redirect('/admin/product-add')
      }else{
        console.log(err)
      } 
    })
  })

})


router.get('/view-all-cakes',async (req,res)=>{
  let cakes=await productHelpers.getProductCake()
 
console.log('llllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllll')

  console.log(cakes);
  res.render('admin/view-all-products',{admin:true,cakes})
})



router.get('/edit-cakes',async(req,res)=>{
  let proId=req.query.id
  console.log('jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj');
console.log(proId);
    let product=await productHelpers.getSingleProduct(proId)
    res.render('admin/edit-products',{admin:true,product})
  
  
})


router.post('/edit-cakes',async(req,res)=>{

  let proId=req.query.id
  console.log("mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm")
  console.log("proID below")
  console.log(proId)
  productHelpers.updateProduct(req.body,proId).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image=req.files.Image1
      image.mv('./public/product-images/'+proId+'1'+'.jpg',(err,done)=>{
        if(err){
        
          console.log(err)
        }
        
      })
    
      image=req.files.Image2
      image.mv('./public/product-images/'+proId+'2'+'.jpg',(err,done)=>{
        if(err){
        
          console.log(err)
        }
        
      })
    
      image=req.files.Image3
      image.mv('./public/product-images/'+proId+'3'+'.jpg',(err,done)=>{
        if(!err){
          res.redirect('/admin')
        }else{
          console.log(err)
        }
        
      })
    }
  })
})




module.exports = router;
