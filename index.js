var graphql = require('graphql').graphql,
	buildSchema = require('graphql').buildSchema;

const mySchema = buildSchema(`
	type Video {
		id: ID,
		title: String,
		duration: Int,
		watched: Boolean
	}
	type Query {
		video: Video
	}

	type Schema {
		query: Query
	}
`)


const myResolvers = {
	video: () => (
		{
			id:  () => 123,
			title: () => "Wolverine",
			duration: () => {
				// we can also use promises to resolve our queries
				// for, example, by running a database query
				return new Promise(function(resolve){
					setTimeout(function(){
						resolve(3800)
					},2000)
				})
			},
			watched: () => false
		}
	)
}


// In our query we must specify properties that exist in our mySchema.Query
const myQuery = `
	query myFirstQuery {
		video {
			id,
			title,
			duration
		}
	}
`


graphql(mySchema, myQuery, myResolvers)
.then((res)=>console.log(res))
.catch(err => console.log(err));