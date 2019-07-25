# nodejs_to_mssql
Retrieves data from a REST API and from there feeds the data to a MS SQL Server.
Purpose: Provide a full example on connecting Node.js with MS SQL Server using current technologies. 
Small script that pulls data from an api, constructs it into the desired JSON object and executes a stored procedure which 
takes in the json string through mssql npm module and on the SQL side utilizes the OPENJSON functionality to insert or update
the JSON data into a table. Just a small script that is used in a scheduled task to populate the chosen table.

Authors note: I found there was a limited number of examples out there on connecting a node.js app with a relational database especially with MS SQL Server. This is the current solution I use for passing bulk amounts of data to SQL. 
    
