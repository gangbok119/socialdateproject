module.exports = (sequelize, DataTypes) => {
    return sequelize.define('user', {
      email: {
        type: DataTypes.STRING(45),
        unique: true,
      },
      
      password: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      gender: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'local',
      },
      photo: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      nickname: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      local: {
        type: DataTypes.STRING(12),
        allowNull: false,
      },
      birthday: {
        type: DataTypes.INTEGER(8),
        allowNull:false,
      },
      email_auth:{
        type: DataTypes.STRING(1),
        allowNull:false,
      },
      login_type:{
        type: DataTypes.STRING(10),
        allowNull:false,
      },
      create_date:{
        type:DataTypes.DATE,
        defaultValue:Date.now,

      },
      content:{
        type: DataTypes.TEXT,
        allowNull:true
      },
      verify_key:{
        type: DataTypes.STRING(100),
        allowNull:false,
      },

    },{
      timestamps:false,
    });

};