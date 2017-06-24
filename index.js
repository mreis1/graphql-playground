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
		video: Video,
		videos: [Video]
	}

	type Schema {
		query: Query
	}
`)


const videoA = {
	id: 123,
	watched: true,
	duration: 1203,
	title: 'Film A'
}
const videoB = {
	id: 123,
	watched: true,
	duration: 1203,
	title: 'Film B'
}

const myResolvers = {
	video: () => videoA,
	videos: () => {
		return new Promise(function(resolve){
			setTimeout(function(){
				resolve([videoA, videoB]);
			},2000)
		})
	}
}


// In our query we must specify properties that exist in our mySchema.Query
const myQuery = `
	query myFirstQuery {
		video {
			id,
			title
		},
		videos {
			id,
			title,
			duration
		}
	}
`


graphql(mySchema, myQuery, myResolvers)
.then((res)=>console.log(JSON.stringify(res)))
.catch(err => console.log(err));