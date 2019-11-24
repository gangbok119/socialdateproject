// module.exports = (sequelize, DataTypes) => {
//     const Membership = sequelize.define('membership', {
//         state: {
//             type: DataTypes.STRING(5),
//             allowNull: false,

//         },
//     }, {
//         timestamps: true,
//         charset: 'utf8',
//         collate: 'utf8_general_ci',
//     });

//     Membership.associate = (db) => {
//         db.Membership.belongsTo(db.User); // 테이블에 UserId 컬럼이 생겨요
//     };
//     return Membership;
// };