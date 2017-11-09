# Galaxy Scraper Extension
Chrome extension that exploits the Galaxy APIs to automatically send data to the current history of your Galaxy instance.

### Scenario
If you want to import in your galaxy history a set of public available data, you can do it in two different ways:
1. download these data on your local computer and then upload all of them on your Galaxy instance;
2. copy the links to your data (one by one) and let Galaxy retrieve them for you.

### Problem
The solution number 2 is definitely better than the number 1 because you do not have to download any data, but if you want to import a lot of data in your Galaxy history, it could take a lot of time to be achieved.

### Solution
This Chrome extension makes you able to search for every links on the current web page (containing the links to the data that you want to import in Galaxy), filter these links (also using regular expressions), and send them to Galaxy by specifying the address in which Galaxy is running, your username, and password, as you can see on the following figure.

> ![Galaxy Data Retrieval Extension](https://raw.githubusercontent.com/fabio-cumbo/galaxy-data-retrieval-extension/master/img/gdre-screenshot.png "Galaxy Data Retrieval Extension")

**NOTES:** it is worth noting that you must have an account on the specified Galaxy instance, and a valid ```API Key```. As reported on the official [Galaxy API Documentation](https://galaxyproject.org/develop/api/): 

```To use the API, you must first generate an API Key for the account you want to access Galaxy from. Please note that this key acts as an alternate means to access your account, and should be treated with the same care as your login password. You can do so in the UI under user preferences (while logged in).```
