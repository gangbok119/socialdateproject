module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('user', {
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
      nickname: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
     
      
      birthday: {
        type: DataTypes.INTEGER(8),
        allowNull:true,
      },
      email_auth:{
        type: DataTypes.STRING(1),
        allowNull:true,
      },
      login_type:{
        type: DataTypes.STRING(10),
        allowNull:true,
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
        allowNull:true,
      },

    },{
      timestamps:false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });

    User.associate = (db) => {
      db.User.hasMany(db.Photo, { as: 'Photos'});
    };

    // User.associate = (db) => {
    //   db.User.belongsTo(db.Membership)
    // };

    return User;

};