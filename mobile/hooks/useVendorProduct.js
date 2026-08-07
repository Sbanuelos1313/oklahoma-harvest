import React,{useState} from "react";
import useVendorProduct from "../../hooks/useVendorProduct";

export default function useVendorProduct() {

  const [product,setProduct]=useState({

    name:"",
    shortDescription:"",
    description:"",
    category:"",

    price:"",
    unit:"each",
    quantity:"",
    lowStock:"5",

    sku:"",
    barcode:"",

    featured:false,
    seasonal:false,
    active:true,

    pickup:true,
    delivery:false,
    shipping:false,

    deliveryRadius:"",
    deliveryFee:"",
    shippingCost:"",
    shippingTime:"",
    pickupInstructions:"",

    ingredients:"",
    allergens:"",
    storage:"",
    harvestDate:"",
    bestBy:"",
    expiration:"",

    organic:false,
    nonGmo:false,
    refrigerated:false,
    frozen:false,

    certifyAccurate:false,
    noMedicalClaims:false,
    acceptMarketplaceRules:false,

    businessLicense:"",
    foodPermit:"",
    certifications:"",

    notes:"",
    images:[],
  });


  function reset(){

    setProduct({

      name:"",
      shortDescription:"",
      description:"",
      category:"",

      price:"",
      unit:"each",
      quantity:"",
      lowStock:"5",

      sku:"",
      barcode:"",

      featured:false,
      seasonal:false,
      active:true,

      pickup:true,
      delivery:false,
      shipping:false,

      deliveryRadius:"",
      deliveryFee:"",
      shippingCost:"",
      shippingTime:"",
      pickupInstructions:"",

      ingredients:"",
      allergens:"",
      storage:"",
      harvestDate:"",
      bestBy:"",
      expiration:"",

      organic:false,
      nonGmo:false,
      refrigerated:false,
      frozen:false,

      certifyAccurate:false,
      noMedicalClaims:false,
      acceptMarketplaceRules:false,

      businessLicense:"",
      foodPermit:"",
      certifications:"",

      notes:"",
      images:[],

    });

  }

  return{

    product,
    update,
    reset,

  };

}