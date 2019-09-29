module.exports = (sequelize, DataTypes) => {
    return sequelize.define('rightnow', {
      user_id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        
      },
      gender: {
        type: DataTypes.STRING(1),
      },
      gps:{
        type:DataTypes.GEOMETRY('POINT'),
      },
      scope: {
        type:DataTypes.INTEGER(11)
      },
      pic:{
        type:DataTypes.STRING(45)
      },
      message:{
        type:DataTypes.STRING(45)
      },
      status:{
        type:DataTypes.STRING(10)
      },
      times:{
        type:DataTypes.INTEGER(11),
      },
      counter_party:{
        type:DataTypes.INTEGER(11),
      },
      create_date:{
        type:DataTypes.DATE,
      },
      mod_date:{
        type:DataTypes.DATE
      },
      
    }, {
      timestamps:false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });

};