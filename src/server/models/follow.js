module.exports = (sequelize, DataTypes) => {
    return sequelize.define('follow', {
      follower: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        
      },
      target: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
      },
    }, {
      timestamps:false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });

};