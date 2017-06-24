var http = require('http'),
	server = http.createServer(),
	express = require('express'),
	app = express(server),
	graphql = require('graphql').graphql,
	buildSchema = require('graphql').buildSchema,
	graphqlHTTP = require('express-graphql');

var {   GraphQLID,
	 	GraphQLSchema,
	 	GraphQLInt,
	 	GraphQLString,
	 	GraphQLBoolean,
	 	GraphQLObjectType,
	 	GraphQLNonNull,
	 	GraphQLList,
	 	GraphQLInputObjectType,
	 	GraphQLInterfaceType } = require('graphql');
/**
add reusability of field types
*/

const videoA = {
	id: 123,
	watched: true,
	duration: 1203,
	title: 'Film A'
}
const videoB = {
	id: 124,
	watched: true,
	duration: 1203,
	title: 'Film B'
}


const nodeInterface = new GraphQLInterfaceType({
	name: 'Node',
	fields: {
		id: {
			type: new GraphQLNonNull(GraphQLID)
		}
	},
	resolveType: (object) => {
		// so we are basically inferring that all 
		// objects with title property are of type videoType
		if (object.title){
			return videoType;
		}

		return null;
	}
})
const videos = [videoA, videoB]

const videoType = new GraphQLObjectType({
	name: 'Video',
	description: 'A video',
	fields: {
		id: {
			// Fix: Error: Node.id expects type "ID!" but Video.id provides type "ID".
			// type: GraphQLID,
			type: new GraphQLNonNull(GraphQLID), //<--- with this new type it matches the interface and errors are gone!
			description: 'The video id'
		},
		title: {
			type: GraphQLString,
			description: 'The video title'
		},
		duration: {
			type: GraphQLInt,
			description: 'The video duration'
		},
		watched: {
			type: GraphQLBoolean,
			description: 'The video watched state'
		}
	},
	interfaces: [nodeInterface]
})

const queryType = new GraphQLObjectType({
	name: 'QueryType',
	description: 'The root query type.',
	fields: {
		videos: {
			type: new GraphQLList(videoType),
			resolve: function(){
				return videos;
			}
		},
		video: {
			type: videoType,
			args: {
				id: {
					type: new GraphQLNonNull(GraphQLID),
					description: 'The movie id'
				}	
			},
			resolve: (_, args) => {
				return findVideoById(args.id)
			}
		}
	}
})

const videoInputType = new GraphQLInputObjectType({
	name: 'VideoInputType',
	fields: {
		// id: {
		// 	type: new GraphQLNonNull(GraphQLID),
		// 	description: 'The video id'
		// },
		title: {
			type: new GraphQLNonNull(GraphQLString),
			description: 'The video title'
		},
		duration: {
			type: new GraphQLNonNull(GraphQLInt),
			description: 'The video duration'
		},
		watched: {
			type: new GraphQLNonNull(GraphQLBoolean),
			description: 'The video watched state'
		}
	}
})

const mutationType = new GraphQLObjectType({
	name: 'Mutation',
	description: 'The root mutation type.',
	fields: {
		createVideo: {
			type: videoType,
			args: {
				video: {
					type: new GraphQLNonNull(videoInputType)
				}
			},
			resolve: function(_, args){
				return createVideo(args.video)
			}
		}
	}
})

const mySchema = new GraphQLSchema({
	query: queryType,
	mutation: mutationType
})

const createVideo = ({title, duration, watched}) => {
	return new Promise((resolve)=>{
		let video = {
			id: new Buffer(new Date().toString()).toString('hex'),
			title,
			duration,
			watched
		};
		videos.push(video)
		resolve(video);
	})
}
const findVideoById = (id) => {
	return new Promise((resolve)=>{
		const [video] = videos.filter((video) => {
			return video.id == id;
		})	
		
		resolve(video);
	})
}

function cors(){
	return function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        if (req.method.toLowerCase() === 'options'){
            // send answer as soon as it hits the server
            res.status(200).end();
        } else {
            next()
        }
    }
}
app.use(cors())
app.use('/graphql', graphqlHTTP(() => {
   const startTime = Date.now()
   return {
	  schema: mySchema,
	  graphiql: true,
	  extensions({ document, variables, operationName, result }) {
		  return { runTime: Date.now() - startTime };
	  }
  }
}));



app.listen(8080)