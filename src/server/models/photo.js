module.exports = (sequelize, DataTypes) => {
    const Photo = sequelize.define('photo', {
      src: {
        type: DataTypes.STRING(200),
        allowNull: false,
        
      },
      order:{
        type: DataTypes.INTEGER(3),
        allowNull: false,
      },
    }, {
      timestamps:true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });

    Photo.associate = (db) => {
        db.Photo.belongsTo(db.User,); // 테이블에 UserId 컬럼이 생겨요
      };
    return Photo;
};