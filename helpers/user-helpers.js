var db=require('../config/connection')
var collection=require('../config/collection')
const { response } = require('../app')
const bcrypt=require('bcrypt')
var moment = require('moment'); 
const Razorpay= require('razorpay');
const { resolve } = require('path');
const objectId=require('mongodb').ObjectId
var instance = new Razorpay({
    key_id: 'rzp_test_wwlKdN1HEsAggm',
    key_secret: 'hIB4Fe2CyR04m633aO8507ll',
  });

module.exports={


    registerUser:(userData)=>{
        return new Promise(async(resolve,reject)=>{
        userData.psw=await bcrypt.hash(userData.psw,10)
        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then
            resolve(userData)
        })
    },

    userPassLogin:(userData)=>{
        console.log(userData)
       
       return new Promise(async (resolve,reject)=>{
           let loginStatus=false
           let response={}
           let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
           
           if(admin){
               bcrypt.compare(userData.Password,admin.Password).then((status)=>{
                   if(status){
                       
                       response.admin=admin
                       response.status=true
                       console.log(response);
                       resolve(response)
                   }else{
                      
                       resolve({status:false,error:"Password Does Not Match"})
                   }
               })
           }else{
           
               resolve({status:false,error:'Email Does Not Exist'})
           }
       })
   },
   
    findUserByMobNum:(mobNum)=>{
        return new Promise(async (resolve,reject)=>{
            let user=null;
         user= await db.get().collection(collection.USER_COLLECTION).findOne({mobnum:mobNum})
         
            resolve(user)
         
         
        })
    },

    editUserDetails:(userData,id)=>{
return new Promise(async(resolve,reject)=>{
    db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(id)},{$set: {fullname:userData.fullname,permanentaddress:userData.permanentaddress,pincode:userData.pincode,altNum:userData.altNum,district:userData.district,state:userData.state }}).then(async ()=>{
        user= await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(id)})
        console.log(user);
        resolve(user)
    })
})
    },

    addToCart:(userId,proId)=>{
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                
                    let proExist=userCart.product.findIndex(product=> product.item==proId)
                    console.log('prooooooooooooo exist')
                    console.log(proExist);
                    if(proExist!=-1){
                        db.get().collection(collection.CART_COLLECTION)
                        .updateOne({user:objectId(userId),'product.item':objectId(proId)},
                        {
                            $inc:{'product.$.quantity':1}
                        }
                        ).then(()=>{
                            resolve()
                            
                        })
                    }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                {
                   
                        $push:{product:proObj}
                    
                }).then((response)=>{
                    resolve()
                })
            }
            }  
            else{
                cartObj={
                    user:objectId(userId),
                    product:[proObj]
                }
    
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((result)=>{
                    resolve()
                })
            }
        })

    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$product'
                },{
                    $project:{
                        item:'$product.item',
                        quantity:'$product.quantity',
                        weight:'$product.weight'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                       item:1,quantity:1,weight:1,product:{$arrayElemAt:['$product',0]}
                    }
                }

            ]).toArray()
            
            resolve(cartItems)
            
        })
    },
    

    changeProductQuantity:(details)=>{
        count=parseInt(details.count)
        quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(count==-1 && quantity==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{product:{item:objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart),'product.item':objectId(details.product)},
                {
                    $inc:{'product.$.quantity':count}
                }
                ).then((response)=>{
                   
                    resolve({status:true})
                    
                })
            }
           
        })
    },

    removeCartProducts:(details)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:objectId(details.cart)},
            {
                $pull:{product:{item:objectId(details.product)}}
            }).then((response)=>{
                resolve({removeProduct:true})
            })
        })
    },

    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            
          let  total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$product'
                },{
                    $project:{
                        item:'$product.item',
                        quantity:'$product.quantity',
                        weight:'$product.weight'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                       item:1,quantity:1,weight:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    
                    $group:{
                        _id:null,
                        
                        total:{$sum:{$multiply: ['$quantity', {$toInt: '$product.Price'},'$weight']}}
                    }
                }

            ]).toArray()
       
            resolve(total[0].total)
           
        })
    },

    getUserAddress:(userId)=>{
        return new Promise(async (resolve, reject)=>{
            let address= await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
            resolve(address)
            
        })
    },

    getPendingOrderProducts:(userId)=>{
        return new Promise(async (resolve, reject)=>{
            
          let  order=await db.get().collection(collection.ORDER_COLLECTION).find({$and: [  {userId:objectId(userId)},{status:"placed"}] }).toArray()
        
        resolve(order)
        })
    },

    getCancelledOrderProducts:(userId)=>{
        return new Promise(async (resolve, reject)=>{
            
          let  order=await db.get().collection(collection.ORDER_COLLECTION).find({$and: [  {userId:objectId(userId)},{status:"cancelled"}] }).toArray()
        
        resolve(order)
        })
    },

    
    getDeliveredOrderProducts:(userId)=>{
        return new Promise(async (resolve, reject)=>{
            
          let  order=await db.get().collection(collection.ORDER_COLLECTION).find({$and: [  {userId:objectId(userId)},{status:"delivered"}] }).toArray()
        
        resolve(order)
        })
    },

    getOrderDetails:(orderId)=>{
        return new Promise(async (resolve,reject)=>{
            let order=await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(orderId)})
            resolve(order)
        })

    },

  


//     validateDiscoundCoupon:(cpCode)=>{
// return new Promise(async (resolve,reject)=>{
//     let code=await db.get().collection(collection.COUPON_COLLECTION).findOne({coupon:cpCode})
//     if(code){
//         resolve({coupon:true})
//     }
//     else{
//         resolve({coupon:false})
//     }
// })
//     },

    deleteuserCart:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(userId)})
            resolve()
        })
 
    },

    addToCart:(userId,proId,weight)=>{
   
        let proObj={
            item:objectId(proId),
            quantity:1,
            weight:weight
        }
        return new Promise(async(resolve,reject)=>{

            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})

            db.get().col
            if(userCart){
                
                    let proExist=userCart.product.findIndex(product=> product.item==proId)
                    console.log('prooooooooooooo exist')
                    console.log(proExist);
                    if(proExist!=-1){
                        db.get().collection(collection.CART_COLLECTION)
                        .updateOne({user:objectId(userId),'product.item':objectId(proId)},
                        {
                            $inc:{'product.$.quantity':1}
                        }
                        ).then(()=>{
                            resolve()
                            
                        })
                    }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                {
                   
                        $push:{product:proObj}
                    
                }).then((response)=>{
                    resolve()
                })
            }
            }  
            else{
                cartObj={
                    user:objectId(userId),
                    product:[proObj]
                }
    
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((result)=>{
                    resolve()
                })
            }
        })

    },
      
    verifyCart:(proId,uid)=>{    
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(uid)})
            if(cart){
                let proExist=cart.product.findIndex(product=> product.item==proId.id)
         
                if(proExist!=-1){
                    console.log('item here');
                    resolve({status:true})
                }
                else{
                    console.log('itemm not here');
                    resolve({status:false})
                }
               
            }else{
                console.log('no cart');
                resolve({status:false})
            }
        })
    },



    PlaceOrder:(order,product,total)=>{
        return new Promise((resolve,reject)=>{
          
            let status=order['payment-method']==='COD'?'placed':'pending'
           let nwdate=new Date()
            var date= moment(nwdate).format('MMM Do YYYY');
            var time= moment(nwdate).format('LT')
            let orderObj={
                deliveryDetails:{
                    name:order.name,
                    mobile:order.mobnum,
                    address:order.permanentaddress,
                    pincode:order.pincode,
                    city:order.city,
                    state:order.state,
                    altNum:order.altNum,
                    expectedDate:order.expectedDate,
                    place:order.place,
                    landmark:order.landmark,
                    deliveryTime:order.deliveryTime,


                },
                userId:objectId(order.userId),
                paymentMethod:order['payment-method'],
                product:product,
                totalAmount:total,
                coupon: order.coupon,
  deliveryCharge: order.deliveryCharge,
  ProductTotal: order.ProductTotal,
  totalwithoutdelivery: order.totalwithoutdelivery,
                date:date,
                time:time,
                status:status
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
              
               console.log(response);
                resolve(response.insertedId)
            })
        })
    },

    generateRazorPay:(orderId,price,user)=>{
        return new Promise((resolve,reject)=>{
            
            instance.orders.create({ 
                 amount: price*100 , 
                 currency: "INR",
                 receipt: ""+orderId,  
                 notes: {    key1: "value3",    key2: "value2"  }},(err,order)=>{
                    
                     console.log(order)
                     if(err){
                         
                         console.log(err);
                     }else{
                         order.user=user
                    console.log("new Order:",order)
                    resolve(order)
                     }
                 })
        })
    },
    
verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', 'hIB4Fe2CyR04m633aO8507ll');
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
        hmac=hmac.digest('hex')
        if(hmac==details['payment[razorpay_signature]']){
            resolve()
        }else{
            reject()
        }
    })
},
changePaymentStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
        {
            $set:{
                status:'placed'
            }
        }).then(()=>{
            resolve()
        })
    })
},
getCouponDetails:(couponId)=>{
    return new Promise((resolve,reject)=>{
       
       db.get().collection(collection.COUPON_COLLECTION).findOne({Code:couponId}).then((coupon)=>{
           
             console.log(coupon);
             resolve(coupon)
    })
  
}

    )},

    addSubscription:(subEmail)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.SUBSCRIPTION_COLLECTION).insertOne(subEmail).then(()=>{
                resolve()
            })
       
        })
    
    }

}

