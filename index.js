var graphql = require('graphql').graphql,
	buildSchema = require('graphql').buildSchema;

const mySchema = buildSchema(`
	type Query {
		foo: String,
		bar: String
	}

	type Schema {
		query: Query
	}
`)


const myResolvers = {
	foo: () => "Hello Value",
	bar: () => {
		// we can also use promises to resolve our queries
		// for, example, by running a database query
		return new Promise(function(resolve){
			setTimeout(function(){
				resolve('Promise Value: ' + new Date().toISOString())
			},2000)
		})
	}
}


// In our query we must specify properties that exist in our mySchema.Query
const myQuery = `
	query myFirstQuery {
		foo,
		bar
	}
`


graphql(mySchema, myQuery, myResolvers)
.then((res)=>console.log(res))
.catch(err => console.log(err));