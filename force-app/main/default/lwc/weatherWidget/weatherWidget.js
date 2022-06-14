import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getWeatherReportAccount from '@salesforce/apex/WeatherWidgetController.getWeatherReportAccount';
import getWeatherReportUser from '@salesforce/apex/WeatherWidgetController.getWeatherReportUser';
import getWeatherReportByCoordinates from '@salesforce/apex/WeatherWidgetController.getWeatherReportByCoordinates';
import getCoordinatesByQuery from '@salesforce/apex/WeatherWidgetController.getCoordinatesByQuery';
import sendReportToContacts from '@salesforce/apex/WeatherWidgetController.sendReportToContacts';
import sendReportToOrgUsers from '@salesforce/apex/WeatherWidgetController.sendReportToOrgUsers';
import Id from '@salesforce/user/Id';

export default class Weather extends LightningElement {

    loading=true;

    @api recordId;
    @api addressType;
    userId = Id;

    lastReportSentDateTime;
    showLastReportSentDateTime=false;

    page;

    showSearchBar=false;
    isSearchBarDisabled=true;
    searchValue="";

    error;
    errorMessage;

    sendButtonLabel;

    emailBody;
    
    unknownWeather=false;
    weatherIconBaseURL = 'https://raw.githubusercontent.com/kickstandapps/WeatherIcons/master/PNG%20Files/';
    weatherIconFinalURL;

    weatherReportJSON;

    city;
    weather;
    windSpeed;
    temperature;
    humidity;

    connectedCallback(){
        if(this.userId==undefined){
            this.page="Website";
            this.showSearchBar=true;
            navigator.geolocation.getCurrentPosition(pos=>{
                getWeatherReportByCoordinates( {latitude : pos.coords.latitude, longitude : pos.coords.longitude})
                    .then(result => {
                        this.weatherReportJSON=JSON.parse(result);
                        this.parseWeatherReport();
                        this.loading = false;
                        this.isSearchBarDisabled=false;
                    }
                );
            }, err=>{
                this.loading=false;
                this.isSearchBarDisabled=false;
                this.error=true;
                this.errorMessage="Couldn't get your location. Please allow geolocation or enter a location in the search bar.";
            });
        }
        else{
            if(this.recordId!=undefined){
                this.page="Account";
                this.sendButtonLabel="Send Report To Contacts";
                getWeatherReportAccount({recordId : this.recordId, addressType : this.addressType})
                    .then(result=> {
                        if(result==undefined){
                            this.error=true;
                            this.errorMessage='Error getting Weather Report for the Account';
                            console.log('error getWeatherReportAccount ' + error);
                            this.loading = false;
                        }
                        console.log('result '+result);
                        this.weatherReportJSON=JSON.parse(result['weatherReportJSON']);
                        if(result['city']!=undefined){
                            this.city=result['city'].toLowerCase();
                            this.city=this.city.charAt(0).toUpperCase() + this.city.slice(1);
                        }
                        if(result['lastReportSentDateTime']!=undefined){
                            this.lastReportSentDateTime=result['lastReportSentDateTime'];
                            this.showLastReportSentDateTime=true;
                        }
                        
                        this.parseWeatherReport();
                        this.loading = false;
                    })
                    .catch(error =>{
                        this.error=true;
                        this.errorMessage='Error getting Weather Report for the Account';
                        console.log('error getWeatherReportAccount ' + error);
                        this.loading = false;
                    });
            }
    
            else{
                this.page="User";
                this.sendButtonLabel="Send Report To Org Users";
                getWeatherReportUser({userId : this.userId})
                    .then(result=> {
                        this.weatherReportJSON=JSON.parse(result['weatherReportJSON']);
                        if(result['city']!=undefined){
                            this.city=result['city'].toLowerCase();
                            this.city=this.city.charAt(0).toUpperCase() + this.city.slice(1);
                        }
                        if(result['lastReportSentDateTime']!=undefined){
                            this.lastReportSentDateTime=result['lastReportSentDateTime'];
                            this.showLastReportSentDateTime=true;
                        }
                        this.parseWeatherReport();
                        this.loading = false;
                    })
                    .catch(error =>{
                        this.error=true;
                        this.errorMessage='Error getting Weather Report for the User';
                        console.log('error getWeatherReportUser ' + error);
                        this.loading = false;
                    });
            }
        }
        
    }

    parseWeatherReport(){
        if(this.weatherReportJSON['weatherObservation']==undefined){
            this.error=true;
            this.errorMessage="No weather observation was found at this location.";
        }
        else{
            if(this.city==undefined){
                this.city=this.weatherReportJSON['weatherObservation']['stationName'];
            }
            if(this.weatherReportJSON['weatherObservation']['weatherCondition']=='n/a'){
                if(this.weatherReportJSON['weatherObservation']['clouds']=='n/a'){
                    this.weather = 'Sun';
                }
                else{
                    let cloudsCode=this.weatherReportJSON['weatherObservation']['cloudsCode']
                    if(cloudsCode=='NSC'||cloudsCode=='SKC'||cloudsCode=='NCD'||cloudsCode=='CLR'||cloudsCode=='CAVOK'){
                        this.weather = 'Sun';
                    }
                    else if(cloudsCode=='FEW'||cloudsCode=='SCT'){
                        this.weather = 'PartlySunny';
                    }
                    else{
                        this.weather = 'Cloud';
                    }
                }
            }
            else{
                let weatherCode = this.weatherReportJSON['weatherObservation']['weatherConditionCode'];
                weatherCode = this.normalizeWeatherCode(weatherCode);
                
                if(weatherCode.startsWith('RA')||weatherCode.startsWith('DZ')){
                    this.weather = 'Rain';
                }

                else if(weatherCode.startsWith('SN')||weatherCode.startsWith('IC')){
                    this.weather = 'Snow';
                }

                else if(weatherCode.startsWith('GR')||weatherCode.startsWith('PL')||weatherCode.startsWith('GS')||weatherCode.startsWith('SG')){
                    this.weather = 'Hail';
                }

                else if(weatherCode.startsWith('BR')||weatherCode.startsWith('FG')||weatherCode.startsWith('HZ')){
                    this.weather = 'Waze';
                }

                else if(weatherCode.startsWith('TS')){
                    this.weather = 'Storm';
                }
                else{
                    this.unknownWeather = true;
                }
            }

            this.weatherIconFinalURL = this.weatherIconBaseURL + this.weather + '.png';

            this.temperature = this.weatherReportJSON['weatherObservation']['temperature'];

            this.humidity = this.weatherReportJSON['weatherObservation']['humidity'];

            this.windSpeed = this.weatherReportJSON['weatherObservation']['windSpeed']*1.852; 
        }
         
        this.emailBody='Here is the current weather at' + this.city + ' :\n\n';
        if(!this.unknownWeather)
            this.emailBody+='The weather : ' + this.weather + '\n';
        if(this.temperature!=undefined)
            this.emailBody+='The temperature : ' + this.temperature + '\n';
        if(this.windSpeed!=undefined)
            this.emailBody+='The Wind Speed : ' + this.windSpeed +'\n';
        if(this.humidity!=undefined)
            this.emailBody+='The humidity : ' + this.humidity;
    }

    normalizeWeatherCode(weatherCode){
        weatherCode = weatherCode.replaceAll('+','');
        weatherCode = weatherCode.replaceAll('-','');

        if(weatherCode.startsWith('VC')||weatherCode.startsWith('MI')||weatherCode.startsWith('PR')||weatherCode.startsWith('DR')
        ||weatherCode.startsWith('BL')||weatherCode.startsWith('FZ')||weatherCode.startsWith('RE')||weatherCode.startsWith('BC')
        ||weatherCode.startsWith('SH')||weatherCode.startsWith('RH')) {
            weatherCode=weatherCode.substring(2);
        }

        return weatherCode;
    }

    handleSendButtonClick(){
        if(this.page=="Account"){
            this.sendToContacts();
        }
        else {
            console.log("VEZAQV");
            this.sendToOrgUsers();
        }
    }

    sendToContacts(){
        sendReportToContacts({ recordId : this.recordId, emailBody : this.emailBody})
            .then(result =>{
                this.lastReportSentDateTime=result;
            })
            .catch(error=>{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error sending emails',
                        variant: 'error',
                    }),
                );
                console.log("Error sending emails to account contacts : "+ error);
            });
    }

    sendToOrgUsers(){
        sendReportToOrgUsers({ userId : this.userId, emailBody : this.emailBody})
            .then(result =>{
                this.lastReportSentDateTime=result;
            })
            .catch(error=>{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error sending emails',
                        variant: 'error',
                    }),
                );
                console.log("Error sending emails to org users : "+ error);
            }
            );
    }

    handleSearch(evt) {
        const isEnterKey = evt.keyCode === 13;
        if (isEnterKey) {
            if(evt.target.value!=undefined&&evt.target.value!=''){
                this.loading=true;
                this.error=false;
                this.city=undefined;
                this.isSearchBarDisabled=true;
                this.searchQuery = evt.target.value;
                getCoordinatesByQuery( { query : this.searchQuery })
                    .then(result=>{
                        if(result!=undefined){
                            getWeatherReportByCoordinates( {latitude : result['lat'], longitude : result['lng']})
                                .then(result => {
                                    this.loading=false;
                                    this.isSearchBarDisabled=false;
                                    this.weatherReportJSON=JSON.parse(result);
                                    this.parseWeatherReport();
                                    this.loading = false;
                                    this.isSearchBarDisabled=false;
                                }
                            )
                            .catch(error=>{
                                this.loading=false;
                                this.isSearchBarDisabled=false;
                                this.error=true;
                                this.errorMessage='Error getting weather report for Coordinates';
                                console.log('error weatherReportByCoordinates ' + error);
                                this.loading = false;
                            });
                        }
                    })
                    .catch(error=>{
                        this.loading=false;
                        this.isSearchBarDisabled=false;
                        this.error=true;
                        this.errorMessage='Error getting Coordinates';
                        console.log('error getCoordinates ' + error);
                        this.loading = false;
                    });
            }
                
        }
    }


}