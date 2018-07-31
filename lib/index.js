'use strict';

const adjustType = type => {
  let newType;
  if (type === 'ObjectId' || type === 'ObjectID') {
    newType = 'object';
  } else {
    newType = type;
  }
  return newType.toLowerCase();
};

function documentModel(Model) {
  const obj = {
    title: Model.modelName,
    properties: {},
    required: []
  };

  const pathsToSchema = (parent, paths) => {
    Object.keys(paths).map(x => paths[x]).forEach(mongooseProp => {
      parent[mongooseProp.path] = {};
      const modelProp = parent[mongooseProp.path];

      // if(mongooseProp.path === 'engagementDoneList') console.log(mongooseProp);

      if (mongooseProp.instance === 'Array') {
        modelProp.type = 'array';
        modelProp.items = {
          properties: {}
        };

        /*
           to do , handle array if schemas
         */
        
        if (mongooseProp.schema) {
          pathsToSchema(modelProp.items.properties, mongooseProp.schema.paths);
        } else {
          modelProp.items = {
            type: 'object'
          };
        }
      } else if (mongooseProp.instance === 'Embedded') {
        modelProp.properties = {};
        modelProp.type = 'object';
        pathsToSchema(modelProp.properties, mongooseProp.schema.paths);
      } else if (mongooseProp.instance === 'ObjectID') {
        modelProp.type = 'string';
        modelProp.required = mongooseProp.isRequired || false;
      } else if (mongooseProp.instance === 'Date') {
        modelProp.type = 'string';
        modelProp.format = 'date-time';
        modelProp.required = mongooseProp.isRequired || false;
      } else {
        modelProp.type = adjustType(mongooseProp.instance);
        modelProp.required = mongooseProp.isRequired || false;
      }

      /**
        handle validators that are not 'user defined'
       */
      if(mongooseProp.validators.length > 0){
        mongooseProp.validators.forEach((validator) => {
          if(validator.type !== 'user defined'){
            if(validator.type === 'min') modelProp.minimum = validator.min
            if(validator.type === 'max') modelProp.maximum = validator.max
            if(validator.type === 'minlength') modelProp.minLength = validator.minlength
            if(validator.type === 'maxlength') modelProp.maxLength = validator.maxlength
            if(validator.type === 'enum') modelProp.enum = validator.enumValues;
            if(validator.type === 'regexp') modelProp.pattern = validator.regexp;
            if(validator.type === 'required') modelProp.required = true;
          }
        })
      }

      // custom mongoose options
      if (mongooseProp.options) {
        if (mongooseProp.options.description) {
          modelProp.description = mongooseProp.options.description;
        }
      }
      if (mongooseProp.enumValues && mongooseProp.enumValues.length) {
        modelProp.enum = mongooseProp.enumValues;
      }
      if (modelProp.required) {
        obj.required.push(mongooseProp.path);
      }
      delete modelProp.required;
    });
  };

  pathsToSchema(obj.properties, Model.schema.paths);

  return obj;
}

documentModel.adjustType = adjustType;

module.exports = documentModel;
