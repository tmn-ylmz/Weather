# Weather Lightning Web Component

This folder contains everything you need to run the Weather LWC in your org.

# How to use
You can add this component either to the home page or to an account report page. In the first case, it will display the weather at the user's location. In the second, it will use either the billing or the shipping address, depending on your choice.

You can also display the component in an external website. To do that, you will first need to wrap the LWC in an aura application. Then, you will have to create a visualforce page displaying that aura application. Finally, you'll have to create a site displaying the visualforce page and give it access to the WeatherWidgetController Apex class. The component will then be displayed at the endpoint you specified. It will use either the user's location (via the browser) or a user input (via a search bar).