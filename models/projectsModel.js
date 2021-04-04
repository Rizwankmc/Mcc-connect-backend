import mongoose from 'mongoose';

const schema = mongoose.Schema({
    title: {
        type: String
    },
    description: {
        type: String
    },
    images: [{
        type: String
    }],
    repoLink: {
        type: String
    },
    technologyUses: [{
        type: String
    }]
}, { timestamps: true });

const ProjectModel = mongoose.model('Project', schema);
export default ProjectModel;