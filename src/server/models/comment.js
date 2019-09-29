module.exports = (sequelize, DataTypes) => {
    return sequelize.define('comment', {
      type: {
        type: DataTypes.STRING(45),
        allowNull: true,
        unique: true,
      },
      writer: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
      },
      target_id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
      },
      depth: {
        type: DataTypes.INTEGER('tiny',2),
        allowNull: false,
      },
      create_date: {
        type: DataTypes.DATE,
      },
      state:{
        type:DataTypes.STRING(10)
      },
      mod_date:{
        type:DataTypes.DATE,
      },
      content:{
        type:DataTypes.TEXT(),
      }
    }, {
      
      timestamps:false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });

};