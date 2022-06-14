@isTest
global class MockHttpResponseGenerator implements HttpCalloutMock {

    global HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{"data":[{"latitude":48.773362,"longitude":2.487993,"type":"postalcode","name":"94380","number":null,"postal_code":"94380","street":null,"confidence":1,"region":"Val-de-Marne","region_code":"VM","county":"Bonneuil-sur-Marne","locality":"Bonneuil-sur-Marne","administrative_area":"Bonneuil-Sur-Marne","neighbourhood":null,"country":"France","country_code":"FRA","continent":"Europe","label":"94380, Bonneuil-sur-Marne, France"}]}');
        res.setStatusCode(200);
        return res;
    }
    
}