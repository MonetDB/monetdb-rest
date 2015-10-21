Tutorial
To start, install MonetDB, start the daemon and create a new dbfarm and database for the REST called `test`:

```
shell> monetdbd create /path/to/mydbfarm
shell> monetdbd start /path/to/mydbfarm
shell> monetdb create test
shell> monetdb release test
shell> monetdb start test
```
Now install the REST proxy via NPM, or clone sources the REST proxy in a new directory and install the dependencies with NPM, and start the app:
```
shell> npm install monetdb-rest
shell> npm start monetdb-rest
```
The proxy will start on port `8888`. By default no database connection are attached, so let's do that next:
```
shell> curl -X PUT -H "Content-Type: application/json" -d '{"host" : "localhost", "port" : 50000, "dbname" : "test", "user" : "monetdb", "password" : "monetdb"}' localhost:8888/database/test
```
Now, let's check what actions we can execute of the database:
```
shell> curl -X GET localhost:8888/database/test/
["document","function","query","schema"]
```
The above indicates that we can access documents, functions, queries and schemas. For now let's check the schemas out.
```
shell> curl -X GET localhost:8888/database/test/schema/
["sys","tmp","json"]
```
We have three schemas. Since sys is the default schema in MonetDB let's see what actions we can perform there:
```
shell> curl -X GET localhost:8888/database/test/schema/sys/
["table","view"]
```
OK, so we've got table and view actions. Let's list what tables we have:
```
shell> curl -X GET localhost:8888/database/test/schema/sys/table/
[]
```
No (non-system) tables found, as expected. Time to create one:
```
shell> curl -X POST -H "Content-Type: application/json" -d '{"table" : "skynet", "columns" : {"id": "int", "first_name": "string", "last_name": "string"}}' localhost:8888/database/test/schema/sys/table/
Table skynet created
```
Next, load some data:
```
shell> curl -X POST -H "Content-Type: application/json" -d '{"values": [1, "John", "Connor"]}' localhost:8888/database/test/schema/sys/table/skynet
shell> curl -X POST -H "Content-Type: application/json" -d '{"values": [2, null, "Connor"]}' localhost:8888/database/test/schema/sys/table/skynet
shell> curl -X POST -H "Content-Type: application/json" -d '{"values" : {"id": 3, "first_name": "Kyle Reese"}}' localhost:8888/database/test/schema/sys/table/skynet
```
Let's see what we have loaded in the tables.
```
shell> curl -X GET localhost:8888/database/test/schema/sys/table/skynet/
[[1,"John","Connor"],[2,null,"Connor"],[3,"Kyle Reese",null]]
```
We've got a few records, but there seem to be a few issues. Let's add a first name to the record with id 2:
```
shell> curl -X PUT -H "Content-Type: application/json" -d '{"first_name": "Sarah"}' localhost:8888/database/test/schema/sys/table/skynet/?filter_id=2
```
Now let's fix the first and last name the 'Kyle Reese' (which has to be URL-encoded version of the string):
```
shell> curl -X PUT -H "Content-Type: application/json" -d '{"first_name": "Kyle", "last_name": "Reese"}' 'localhost:8888/database/test/schema/sys/table/skynet/?filter_first_name=Kyle%20Reese'
```
Next, check how well we've done by listing all records ordered by last name:
```
shell> curl -X GET localhost:8888/database/test/schema/sys/table/skynet/?orderBy=last_name 
[[2,"Sarah","Connor"],[1,"John","Connor"],[3,"Kyle","Reese"]]
```
Now remove all records with last name 'Connor':
```
shell> curl -X DELETE localhost:8888/database/test/schema/sys/table/skynet/?filter_last_name=Connor
```
This should've left us only one record.
```
shell> curl -X GET localhost:8888/database/test/schema/sys/table/skynet/
[[3,"Kyle","Reese"]]
```
Good, enough of tables. Next, let's store a few documents in our database. First thing, let's initialize the documents schema and table:
```
shell> curl -X POST localhost:8888/database/test/document/_init
Document schema and table initialised
```
Next, create a new document storing information about a classic Asimov book:
```
shell> curl -X POST -H "Content-Type: application/json" -d '{"type": "book", "title": "Foundation", "authors": ["Isaac Asimov"], "year": 1951, "genre": "sci-fi"}' localhost:8888/database/test/document/
Document 9ef729da-2669-426c-9004-c661c6010810 created
shell> curl -X POST -H "Content-Type: application/json" -d '{"type": "book", "title": "Dune", "authors": ["Frank Herbert"], "year": 1965, "genre": "sci-fi"}' localhost:8888/database/test/document/
Document b564796c-5783-47cc-98eb-5e576fab924f created
```
The responses you get is probably slightly different, this is because the documents were stored with under generated UUID. Now, let's store another one, giving it an explicit id:
```
shell> curl -X PUT -H "Content: "Second Foundation", "authors": ["Isaac Asimov"], "genre": "sci-fi"}' localhost:8888/database/test/document/foundation2/
Document foundation2 created
```
Let's see what we have stored so far:
```
shell> curl -X GET localhost:8888/database/test/document/_all
[{"id":"9ef729da-2669-426c-9004-c661c6010810","body":{"type":"book","title":"Foundation","authors":["Isaac Asimov"],"year":1951,"genre":"sci-fi"}}, {"id":"b564796c-5783-47cc-98eb-5e576fab924f","body":{"type":"book","title":"Dune","authors":["Frank Herbert"],"year":1965,"genre":"sci-fi"}}{"id":"foundation2","body":{"type":"book","title":"Second Foundation","authors":["Isaac Asimov"],"genre":"sci-fi"}}]
```
Looks right, but the 'Second Foundation' is missing publication year. We can fix that by overwriting the document - PUT-ing a new one with all properties in place.
```
shell> curl -X PUT -H "Content-Type: application/json" -d '{"type": "book", "title": "Second Foundation", "authors": ["Isaac Asimov"], "year": 1953, "genre": "sci-fi"}' localhost:8888/database/test/document/foundation2/
```
Let's check if the stored document is now correct:
```
shell> curl -GET localhost:8888/database/test/document/foundation2
{"id":"foundation2","body":{"type":"book","title":"Second Foundation","authors":["Isaac Asimov"],"year":1953,"genre":"sci-fi"}}
```
Looks good. Finally, let's search for all books that have a title containing 'Foundation':
```
shell> curl -X GET localhost:8888/database/test/document/_find?title=Foundation
[{"id":"9ef729da-2669-426c-9004-c661c6010810","body":{"type":"book","title":"Foundation","authors":["Isaac Asimov"],"year":1951,"genre":"sci-fi"}},{"id":"foundation2","body":{"type":"book","title":"Second Foundation","authors":["Isaac Asimov"],"year":1953,"genre":"sci-fi"}}]
```
