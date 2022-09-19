const moment = require("moment");
const {ObjectId} = require("mongodb");
const fs = require('fs');
// Mongoose
const mongoose = require("mongoose");
// Models
const Team = require("../Models/Team");
const TeamInvite = require("../Models/TeamInvite")
// Helpers
const GeneralHelper = require("./GeneralHelper");
const FriendRequest = require("../Models/FriendRequests");
exports.createTeam = async (teamViewName, teamNickName, imagePath, userId) => {
    const team = new Team({
        _id: new mongoose.Types.ObjectId(),
        teamViewName: teamViewName,
        teamNickName: teamNickName,
        teamLeader: userId,
        teamTitleImage: imagePath
    });
    await team.save();
    await Team.updateOne({_id: team._id}, {
        $push: {
            teamMembers: {
                userId: userId,
                role: "Player"
            }
        }
    })
    return team._id
}
exports.createFranchiseTeam = async (teamViewName, teamNickName, imagePath, franchiseId) => {
    const team = new Team({
        _id: new mongoose.Types.ObjectId(),
        teamViewName: teamViewName,
        teamNickName: teamNickName,
        teamLeader: null,
        teamTitleImage: imagePath,
        teamType: franchiseId
    });
    await team.save();
    return team._id
}
exports.createTeamInvite = async (teamId, userId, friendId) => {
    const teamInvite = new TeamInvite({
        _id: mongoose.Types.ObjectId(),
        teamId: teamId,
        from: userId,
        to: friendId
    });
    await teamInvite.save();
    return await teamInvite._id
};
exports.findTeam = async (teamViewName) => {
    return await Team.findOne({teamViewName: teamViewName});
};
exports.findTeamWithoutDeleted = async (teamViewName) => {
    return await Team.findOne({teamViewName: teamViewName, isDeleted: false});
};
exports.findFranchiseTeamViewNameWithoutDeleted = async (teamViewName, franchiseId) => {
    return await Team.findOne({teamViewName: teamViewName, isDeleted: false, teamType: {$ne: null}});
};
exports.findTeamByTeamId = async (teamId) => {
    return await Team.findOne({_id: teamId});
};
exports.findInviteById = async (id) => {
    return await TeamInvite.findOne({_id: id, isDeleted: false});
}
exports.findInvite = async (teamId, userId, friendId) => {
    return TeamInvite.findOne({
        teamId: mongoose.Types.ObjectId(teamId),
        from: mongoose.Types.ObjectId(userId),
        to: mongoose.Types.ObjectId(friendId),
        status: "pending",
    }).populate("teamId from to", "teamViewName userDetail.fullName userDetail.userName");
};
exports.findRequestedInvite = async (teamId, userId, fromId) => {
    return await TeamInvite.findOne({
        teamId: mongoose.Types.ObjectId(teamId),
        from: mongoose.Types.ObjectId(fromId),
        to: mongoose.Types.ObjectId(userId),
        status: "pending",
        isDeleted: false
    }).populate("teamId from to", "teamViewName userDetail.fullName userDetail.userName");
};
exports.acceptInvitation = async (teamId, userId, fromId, status) => {
    await TeamInvite.updateOne(
        {teamId: teamId, to: userId, from: fromId, status: "pending"},
        {status: status.toLowerCase()}
    );
};
exports.addMemberToTeam = async (teamId, userId) => {
    return await Team.updateOne({_id: teamId}, {
            $push: {
                teamMembers: {
                    userId: userId,
                    role: "Player"
                }
            }
        }
    )
}
exports.deleteHardTeamInvitation = async (teamId, toId, fromId) => {
    return await Team.findOneAndDelete({
        teamId: teamId,
        from: fromId,
        to: toId,
    })
}
exports.findAdmin = async (leader, team) => {
    return TeamInvite.findOne({teamName: team, Leader: leader});
};
exports.findTeamsOfaUser = async (leader) => {
    return await Team.find({Leader: ObjectId(leader)});
};
exports.showAllTeamInfo = async (teamId) => {
    console.log({teamId});
    return await Team.findById(teamId).populate(["Leader", "Members.userId"]);
};
exports.deleteTeam = async (teamId) => {
    return await Team.updateOne({_id: teamId,}, {$set: {isDeleted: true, deletedAt: moment()}});
};
exports.editTeamInfo = async (teamId, name) => {
    let team = await Team.findById(ObjectId(teamId));
    team.teamName = name;
    let teamModal = new Team(team);
    return teamModal.save().then((fullfilled) => {
        return fullfilled;
    });
};
exports.kickMember = async (userName, teamName) => {
    let result = "";
    await Team.updateOne(
        {teamName: teamName},
        {$pull: {Members: {userName: userName}}}
    );
    await TeamInvite.deleteOne({
        teamName: teamName,
        userName: userName,
    })
        .exec()
        .then((docs) => {
            result = docs;
        })
        .catch((err) => {
            res.status(500).json({
                error: err,
            });
        });
    return result;
};
exports.findMember = async (userName, teamName) => {
    return await Team.findOne({
        Members: {$elemMatch: {userName: userName, teamName: teamName}},
    });
};
exports.showAllInvitations = async (pageNo, userId, searchValue = null) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let invitationCondition = [{isDeleted: false, status: "Pending", to: userId}];
    invitationCondition = {$and: invitationCondition};
    let result = await TeamInvite.find(invitationCondition)
        .populate("to from teamId", "userDetail.fullName teamViewName")
        .sort({_id: -1})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await TeamInvite.find(invitationCondition).countDocuments();
    return {
        pagination: GeneralHelper.makePaginationObject(
            pg.pageNo,
            pg.pageSize,
            pg.skip,
            total,
            result.length
        ),
        data: result,
    };
};
exports.showPendingInvitations = async (
    pageNo,
    _userName,
    searchValue = null
) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let invitationCondition = [
        {isDeleted: false, userName: _userName, status: "pending"},
    ];
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
        invitationCondition.push({
            $or: [
                {teamName: {$regex: regex}},
                {userName: {$regex: regex}},
                {status: {$regex: regex}},
            ],
        });
    }
    invitationCondition = {$and: invitationCondition};
    let result = await TeamInvite.find(invitationCondition)
        .sort({_id: -1})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await TeamInvite.find(invitationCondition).countDocuments();
    return {
        pagination: GeneralHelper.makePaginationObject(
            pg.pageNo,
            pg.pageSize,
            pg.skip,
            total,
            result.length
        ),
        data: result,
    };
};
exports.showMyTeamsAsLeader = async (userId) => {
    return await Team.find({Leader: userId}).populate("Leader", "fullName");
};
exports.showTeams = async (userId) => {
    return await Team.find({
            'teamMembers.userId': {$in: [mongoose.Types.ObjectId(userId)]},
            teamType: null,
            isDeleted: false
        },
        {teamViewName: 1, teamNickName: 1, teamTitleImage: 1, winsCount: 1, lossCount: 1})
};
exports.getUserAllTeams = async (userId) => {
    return await Team.find({
            'teamMembers.userId': {$in: [mongoose.Types.ObjectId(userId)]},
            isDeleted: false
        },
        {teamViewName: 1, teamNickName: 1, teamTitleImage: 1, winsCount: 1, lossCount: 1})
};
exports.findTeamById = async (data) => {
    return await Team.findOne({
        _id: mongoose.Types.ObjectId(data.teamId)
    })
}
exports.findTeamByIdWithoutDelete = async (teamId) => {
    return await Team.findOne({
        _id: mongoose.Types.ObjectId(teamId),
        isDeleted: false
    })
}
exports.isTeamLeader = async (data, userId) => {
    return await Team.findOne({_id: data.teamId, teamLeader: mongoose.Types.ObjectId(userId)})
}
exports.updateTournamentDetail = async (teamId, tournamentId) => {
    return await Team.updateOne({_id: teamId}, {$push: {participatingInTournaments: tournamentId}})
};
exports.updateTournamentGameDetail = async (teamId, gameToPlay) => {
    return await Team.updateOne({_id: teamId}, {$push: {participatingInGames: gameToPlay}})
};
exports.findTeamDeatilByTeamId = async (teamId) => {
    return await Team.findOne({
        _id: teamId
    }).populate("teamLeader", "profileImage userDetail.fullName userDetail.wins userDetail.losses")
}
exports.findTeamDetailByTeamIdWithoutDelete = async (teamId) => {
    return await Team.findOne({
        _id: mongoose.Types.ObjectId(teamId), isDeleted: false
    }).populate("teamLeader", "profileImage userDetail.fullName userDetail.wins userDetail.losses")
}
exports.findTeamInviteByTeamId = async (teamId) => {
    return await Team.findOne({
        _id: teamId,
        // isDeleted: false
    })
}
exports.findParticipateInTeam = async (teamId, teamMemberId) => {
    return await Team.findOne({_id: teamId, 'teamMembers.userId': {$in: [mongoose.Types.ObjectId(teamMemberId)]}})
}
exports.leaveTeamMember = async (teamId, teamMemberId) => {
    await Team.updateOne(
        {_id: teamId},
        {$pull: {teamMembers: {userId: {$in: [mongoose.Types.ObjectId(teamMemberId)]}}}}
    );
    await TeamInvite.updateOne({teamId: teamId, to: mongoose.Types.ObjectId(teamMemberId)}, {
        $set: {
            isDeleted: true,
            deletedAt: moment()
        }
    })
    return true
};
exports.updateTitleImage = async (teamId, teamTitleImagePath) => {
    let team = await Team.findOne({_id: teamId});
    let oldTeamTitleImage = team.teamTitleImage
    team.teamTitleImage = teamTitleImagePath || team.teamTitleImage
    if (oldTeamTitleImage != "") {
        fs.unlinkSync(oldTeamTitleImage)
    }
    let teamModel = new Team(team);
    return teamModel.save().then((fullfilled) => {
        return fullfilled;
    });
}
exports.updateCoverImage = async (teamId, teamCoverImage) => {
    let team = await Team.findOne({_id: teamId});
    let oldTeamCoverImage = team.teamCoverImage
    team.teamCoverImage = teamCoverImage || team.teamCoverImage
    if (oldTeamCoverImage != "") {
        fs.unlinkSync(oldTeamCoverImage)
    }
    let teamModel = new Team(team);
    return teamModel.save().then((fullfilled) => {
        return fullfilled;
    });
}
exports.updateTeamViewName = async (teamId, teamViewName) => {
    let team = await Team.findOne({_id: teamId});
    team.teamViewName = teamViewName || team.teamViewName
    let teamModel = new Team(team);
    return teamModel.save().then((fullfilled) => {
        return fullfilled;
    });
}
exports.findAllReceivedTeamInvite = async (userId) => {
    return await TeamInvite.find({to: mongoose.Types.ObjectId(userId), isDeleted: false})
}
exports.findAllSendTeamInvite = async (userId) => {
    return await TeamInvite.find({from: mongoose.Types.ObjectId(userId), isDeleted: false})
}
exports.dbExist = async () => {
    return await TeamInvite.exists()
}
exports.findMyTeams = async (userId) => {
    return await Team.find({'teamMembers.userId': {$in: [mongoose.Types.ObjectId(userId)]}})
}
exports.findFranchiseTeamWithoutDeleted = async (franchiseId) => {
    return await Team.find({isDeleted: false, teamType: franchiseId});
};
exports.makeTeamLeader = async (teamId, userId) => {
    await Team.updateOne({_id: teamId}, {
        $set: {teamLeader: userId}
    })
}
exports.updateLeagueDetail = async (teamId, leagueId) => {
    return await Team.updateOne({_id: teamId}, {$push: {participatingInLeagues: leagueId}})
};
exports.findUserFranchiseTeam = async (userId) => {
    return await Team.findOne({
        'teamMembers.userId': {$in: [mongoose.Types.ObjectId(userId)]},
        teamType: {$ne: null},
        isDeleted: false
    })
}
exports.findAlreadyParticipatingInGame = async (teamId, gameToPlay) => {
    return await Team.findOne({
        _id: mongoose.Types.ObjectId(teamId),
        participatingInGames: {$in: [mongoose.Types.ObjectId(gameToPlay)]}
    })
}
exports.findAlreadyParticipatingInLeague = async (teamId, leagueId) => {
    return await Team.findOne({
        _id: mongoose.Types.ObjectId(teamId),
        participatingInLeagues: {$in: [mongoose.Types.ObjectId(leagueId)]}
    })
}
exports.findTeamIsPlayLeague = async (teamId) => {
    return await Team.find({
        $or: [{teamOne: mongoose.Types.ObjectId(teamId)}, {teamTwo: mongoose.Types.ObjectId(teamId)}],
        winner: null
    })
}
exports.updateTeamLeader = async (teamId, leaderId) => {
    return await Team.updateOne({_id: mongoose.Types.ObjectId(teamId)}, {$set: {teamLeader: mongoose.Types.ObjectId(leaderId)}})
}
exports.addUserToTeam = async (teamId, userObj) => {
    return await Team.updateOne({_id: mongoose.Types.ObjectId(teamId)}, {$push: {teamMembers: userObj}})
}
exports.updateTeamPrzPointValue = async (teamId, memberId, numberValue) => {
    return await Team.updateOne({
        _id: mongoose.Types.ObjectId(teamId),
        "teamMembers": {"$elemMatch": {"userId": mongoose.Types.ObjectId(memberId)}}
    }, {$set: {'teamMembers.$.prz': numberValue}})
}
exports.updateTeamMcdPointValue = async (teamId, memberId, numberValue) => {
    return await Team.updateOne({
        _id: mongoose.Types.ObjectId(teamId),
        "teamMembers": {"$elemMatch": {"userId": mongoose.Types.ObjectId(memberId)}}
    }, {$set: {'teamMembers.$.mcd': numberValue}})
}
exports.updateTeamMprzPointValue = async (teamId, memberId, numberValue) => {
    return await Team.updateOne({
        _id: mongoose.Types.ObjectId(teamId),
        "teamMembers": {"$elemMatch": {"userId": mongoose.Types.ObjectId(memberId)}}
    }, {$set: {'teamMembers.$.mprz': numberValue}})
}
exports.findPendingTeamInvite = async (teamId) => {
    return await TeamInvite.find({teamId: mongoose.Types.ObjectId(teamId), status: "pending"})
}