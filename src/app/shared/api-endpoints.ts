const BASE = 'http://127.0.0.1:5000';
//const BASE = 'https://192.168.80.84/seiraapi';

export const API_ENDPOINTS = {
  BASE,
  LOGIN: '/login/login',
  GETREFRESHEDJWTTOKEN: '/common/getrefreshedjwttoken',
  CONFIG: {
    MAIN_MENU: `${BASE}/config/main-menu`,
    SCREEN: `${BASE}/config/screen`,
    REFERENCE_SCREEN: `${BASE}/config/reference-screen`,
  },
  CORE: {
    GETCOLUMNMETADATA: '/common/getcolumnmetadata',  
     SORT_DATA: {
      SAVE: '/Common/savesortingdata',
      GET: '/Common/getsortingdata',
    },
    SWAP_DATA : {
        GET : '/common/getswapcolumndata',
        SAVE : '/common/swapcolumnData'
    },
    REFERENCE_SCREEN : {
      GET : '/common/getReferenceScreenData',
      REFERENCE_SETTINGS : {
        GET : '/Common/getreferencesetting',
        SAVE : '/Common/SaveReferenceSetting'
      }
    },
    HISTORY_DATA : {
        GET : '/common/historydata',
        EXPORTDATA : '/common/Exportdata'
    },
    LOG_ERROR: {
      LOG: '/common/logerror',
    },
    EXPORT_DATA : {
      EXPORT : '/common/Exportdata'
    },
    GET_PLANT_INFO:{
      GET_PLANT_DATA : '/common/GetPlantInfo'
    }
  },
  COMMONFEATURES:{
    GETCURRCODE:'/common/getcurrencycode',
    getExchangeRate:'/common/getExchangeRate',
  }
};