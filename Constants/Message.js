function define(name, value) {
	Object.defineProperty(exports, name, {
		value: value,
		enumerable: true,
	});
}
// General Messages
define("NOT_AUTHORIZE_ACTION", "Not authorize for this action");
define("REQUEST_SUCCESSFUL", "Request Successful.");
define(
	"INVALID_PASSWORD",
	"Invalid password. Use Alphanumeric and Special Characters"
);
define("INVALID_USERNAME", "Invalid User Name Format");
define("INVALID_FULL_NAME", "Invalid Full Name Format");
define("LOGIN_SUCCESS", "You are Successfully Logged in.");
define("WENT_WRONG", "Something Went Wrong!");
define("EMAIL_RECEIVED_SHORTLY", "You will Receive an Email Shortly.");
define("MISSING_PARAMETER", "Check Missing Fields.");
define("MISSING_PAGE_NUMBER", "Missing Page Number.");
define("AUTHENTICATION_FAILED", "Authentication Failed!");
define("PERMISSION_DENIED", "You don't have permission for this operation!");
define("ALREADY_EXIST", "Already exist!");
define("NAME_ALREADY_EXIST", "Name already exist!");
define(
	"NO_REQUEST_FOUND",
	"Sorry, but you dont have any friend request from this user"
);
define("TOKEN_NOT_FOUND", "Token not found");
define("INVALID_TOKEN", "Your token is invalid");
define("INVALID_EMAIL", "Email format is invalid");
define("ALREADY_BLOCKED", "User already blocked");
define("WRONG_PASSWORD", "Wrong Password");
define("NEW_REQUEST_EXPIRED", "Password request has expired");
// User Messages
define("USER_NOT_EXIST", "User not exist.");
define("USER_ADDED_SUCCESS", "User was added successfully.");
define("EMAIL_EXIST", "Oops - email already exists.");
define("EMAIL_NOT_EXIST", "Email does not exist.");
define("DUPLICATE_USERNAME_EMAIL", "Duplicate Username or Emails");
define("INVALID_REQUEST", "Your request cannot proceed");
define("ALREADY_REQUESTED", "Request already sent");
define("USERNAME_EXIST", "Username not available");
define("NOT_REQUESTED", "Not any request found");
define("CREDIT_AMOUNT_NOT_CORRECT", "Incorrect credit amount");
// Image Messages
define("IMAGE_UPDATE_SUCCESS", "Image was updated successfully.");
define("IMAGE_UPLOAD_SUCCESS", "Image was uploaded successfully.");
define("IMAGE_REMOVED_SUCCESS", "Image was removed successfully.");
define("IMAGE_NOT_READ", "Image not read");
define("VIDEO_IMAGE_NOT_READ", "Image or Video not Load/Read");
define("IMAGE_TYPE_ERROR", "File type must be JPEG, JPG or PNG");
//Video Messages
define("VIDEO_TYPE_ERROR", "File type must be MP4");
define("VIDEO_IMAGE_TYPE_ERROR", "File type must be JPEG, JPG, PNG or MP4");
// Email Subjects
define("REGISTER_SUCCESS", "Registration Successful!");
define("RESET_PASSWORD", "Reset Password!");
define("GAME_EXIST", "Game already exist");
define("GAME_DOESNOT_EXIST", "Game doesn't exists");
define("TOURNAMENT_DOES_NOT_EXISTS", "Tournament not exist");
define(
	"TOURNAMENT_ALREADY_STARTED",
	"The Tournament has already started,You can't join now"
);
//Team
define("TEAM_DOESNOT_EXIST", "Team Doesn't Exists");
define("TEAM_LEADER_JOIN", "Only Team Leader Can Join Tournament");
define("TEAM_SIZE_NOT_MATCH", "Team Size Not Valid");
define(
	"TEAM_SIZE_EXCEED",
	"Required Number of Teams Already Participating, Limit exceeded!!!"
);
define("TEAM_ALREADY_PARTICIPATING", "Team Already Participating");
define("TEAM_NOT_PARTICIPATING", "Team not Participating");
define(
	"MEMBER_ALREADY_PARTICIPATED",
	"One of Your Team Member Already Participated from Other Team. Kindly Remove that Participant to Join"
);
define("NOT_TEAM_MEMBER", "You are not Team Member");
define("TEAM_LEADER_CAN_KICK_OUT", "Only Team Leader Kick out Team Member");
define("TEAM_LEADER_NOT_KICK_OUT", "Team Leader not Kick Out");
define("LEADER_CAN_NOT_LEAVE_TEAM", "Leader cannot Leave the Team");
define("LEADER_CHANGE", "Only Leader can Change");
define("LEADER_DELETE", "Only Leader can Delete");
define("TEAM_EXIST", "Team already exist");
define("TOTAL_TEAMS_REQUIRED_IN_EVEN", "Total teams must be Even");
define("TOTAL_TEAMS_ERROR", "Total teams must be 4,8,16,32");
define(
	"TEAM_PARTICIPATE_IN_MATCH",
	"Not delete, Team participate in match / league"
);
define("ALREADY_IN_FRANCHISE_TEAM", "Already member of (any) franchise team");
define("MINIMUM_TEAM_REQUIRED", "Minimum total team must be 4");
define("NO_TEAM_LEADER_FOUND", "No team leader found");
define("TOTAL_TEAMS_NOT_LESS_THAN_8", "Total teams must be 8 or greater");
//
define("LADDER_DOES_NOT_EXIST", "Ladder Not Exists");
define("MATCH_ALREADY_EXIST", "Match Already Exist!");
define("CHECK_FRIEND_REQUEST", "Please Check Your Friend Request");
define("NOT_ENOUGH_CREDIT", "You Have Not Enough Credit");
define("ALREADY_UPDATED", "Result Already Updated");
define("ALREADY_MEMBER", "Already Team Member");
define("DATE_PASSED", "Starting Date has Passed");
define("ALREADY_SUBMITTED", "Request Already Submitted");
define("LADDER_NOT_EXIST", "Ladder not exist");
define("CAN_NOT_START_TWL", "Ladder not ended, Can not start Total War Ladder");
define(
	"ALREADY_WIN_TOURNAMENT_RESULT",
	"One Team Already Win This Tournament. Please Change Status of That Team to Win this Team,ONLY ONE WINNING TEAM REQUIRED"
);
define(
	"LADDER_RESULT_RECORD_NOT_FOUND",
	"Ladder result record not found with this ID"
);
define(
	"ALREADY_WIN_MATCH_RESULT",
	"One User Already Win This Match. Please Change Status of That User to Win this User,ONLY ONE WINNING USER REQUIRED"
);
define(
	"MATCH_RESULT_RECORD_NOT_FOUND",
	"Match result record not found with this ID"
);
define("USER_INSUFFICIENT_CREDIT", "You do not have sufficient credit");
define(
	"FRIEND_INSUFFICIENT_CREDIT",
	"The user you are inviting does not have sufficient credit"
);
define(
	"ALREADY_HAVE_THIS_STATUS",
	"Someone already have this status (Win / Loss)"
);
define("NOT_BELONG_TO_FRANCHISE", "For only franchise users");
define(
	"ONLY_FRANCHISE_OWNER_CAN_KICK_OUT",
	"Only franchise owner can kick out team member"
);
define(
	"ONLY_FRANCHISE_OWNER_CAN_DELETE",
	"Only franchise owner can delete franchise"
);
define("ALREADY_IN_FRANCHISE", "Already have franchise");
define("LEAGUE_DOES_NOT_EXISTS", "League not exist");
define("FRANCHISE_PARTICIPATING", "Franchise already participating");
define("SLOTS_EMPTY", "Pending registration of total teams");
define(
	"LEAGUE_PENDING_REGISTRATION",
	"Pending registration of league's total teams"
);
define(
	"FL_PENDING_REGISTRATION",
	"Pending registration of required teams for fantasy league"
);
define("SCHEDULE_ALREADY_CREATED", "League schedule already generated");
define("ID_NOT_FOUND", "Id not found");
define("FRANCHISE_OWNER_NOT_REQUESTED", "Can not send request to Owner");
define("UNBLOCK_FRANCHISE_FIRST", "Franchise is blocked. Unblock it first!");
define(
	"NOT_ELIGIBLE_TO_ACCEPT",
	"You are not eligible to accept the challenge"
);
define("MATCH_ID_NOT_VALID", "Wrong match id");
define("FRANCHISE_NOT_FOUND", "Franchise not found");
define("PENDING_LEAGUE_RESULTS", "Pending results of current round");
define("CHECK_NEW_SCHEDULE", "Check schedule for new round");
define(
	"ONLY_FRANCHISE_OWNER_CAN_DELETE_LEAGUE",
	"Only franchise owner can delete league"
);
define("INVALID_STARTING_DATE", "Starting date is not valid");
define("INVALID_ENDING_DATE", "Ending date is not valid");
define(
	"LEAGUE_FOR_THIS_YEAR_ALREADY_EXIST",
	"League for this year is already exist"
);
define(
	"SOME_LEAGUE_HAVE_PENDING_RESULT",
	"Some leagues have pending result or not end, Can not Delete!"
);
define("NOT_PARTICIPATING", "Wrong Match Id or Not participating");
define("ALREADY_SELECTED", "Member already selected");
define("NOT_UPDATE_NOW", "Update not allowed now");
define(
	"REQUIRED_TEAMS_ALREADY_REGISTERED",
	"No. of required total teams already registered"
);
define("ALREADY_JOINED", "Already Joined");
define("NOT_FRANCHISE_TEAM", "Select franchise team");
define("NO_RECORD_WITH_MATCH_ID", "No record found with this match id");
define(
	"SCHEDULE_TYPE_ROUND_NO_INCORRECT",
	"Schedule type or Round number incorrect"
);
define("LEAGUE_START_DATE_WAIT", "Waiting for League start date");
define("GP_LEAGUE_NOT_STARTED", "Grand Prix league has not been started yet");
define("TEAM_NOT_FOUND", "Team not found");
define("USER_TEAM_NOT_FOUND", "User team not found");
define("FANTASY_LEAGUE_NOT_EXIST", "Fantasy League not exist");
define(
	"CAN_NOT_PLAY_FL",
	"League played round, Can not start Fantasy League Now !"
);
define("RECORD_NOT_FOUND", "Record not found");
define("CAN_NOT_SUBMIT_RESULT", "Can not submit result after end date");
define("TWL_NOT_EXIST", "Total War Ladder not exist!");
define("RESULT_ALREADY_SUBMITTED", "Result already submitted");
define(
	"LESS_THAN_REQUIRED_TEAMS",
	"Total teams of ladder are less than required teams"
);
define("CAN_NOT_JOIN_AFTER_DATE", "Can not join after start date");
define(
	"LADDER_RESULT_NOT_FINALIZE_PENDING",
	"Ladder results should be finalize before Total War Ladder start"
);
define(
	"CAN_NOT_CREATE_FL_LEAGUE_END",
	"Can not create Fantasy League after League ended"
);
define(
	"CAN_NOT_SUBMIT_RESULT_BEFORE_START",
	"Can not submit result before start"
);
define("CAN_NOT_UPDATE", "Can not update after team/teams registration");
define("CAN_NOT_DELETE_RESULT_WAITING", "Can not delete! Wait for results");
define(
	"CAN_NOT_DELETE_PENDING_RESULT",
	"Can not delete! Pending results exist"
);
define(
	"CAN_NOT_DELETE_SOME_PENDING_RESULT",
	"Can not delete! Wait for some results"
);
define(
	"CAN_NOT_DELETE_TEAM_PENDING_RESULT",
	"Can not delete! Wait for all teams results"
);
define(
	"TEAM_HAS_PENDING_INVITES",
	"Can not delete! Pending team invites exist"
);
define("SOME_RESULT_NOT_DELETE", "Some pending results can not delete!");
define(
	"SOME_RECORDS_NOT_DELETE",
	"Some records can not delete (wait for FL end)"
);
define(
	"NOT_JOIN_TEAM_PARTICIPATING_TOURNAMENT",
	"Can not join team! Team currently playing in tournament"
);
define(
	"NOT_JOIN_TEAM_PARTICIPATING_LADDER",
	"Can not join team! Team currently playing in ladder"
);
define(
	"NOT_KICK_TEAM_PARTICIPATING_TOURNAMENT",
	"Can not kick out from team! Team currently playing in tournament"
);
define(
	"NOT_KICK_TEAM_PARTICIPATING_LADDER",
	"Can not kick out from team! Team currently playing in ladder"
);
define(
	"NOT_KICK_TEAM_PARTICIPATING_LEAGUE",
	"Can not kick out from team! Team currently playing in league"
);
define("IMAGE_UPDATED", "Image updated successfully");
define(
	"FRANCHISE_BLOCK_OR_DELETED",
	"Franchise may be either blocked or deleted"
);
define(
	"TOURNAMENT_START_DATE_TIME_WAIT",
	"Waiting for Tournament start date and time"
);
define("LEAGUE_PLAYER_CANNOT_PARTICIPATE", "League Player cannot play FL");
define(
	"LEAGUE_PLAYER_CANNOT_JOIN",
	"League player can not join Fantasy League"
);
define("LEAGUE_PLAYER_CANNOT_CREATE_FL", "League player can not create FL");
define("ADMIN_REQUIRED", "Admin role required!");
define(
	"USER_IS_FRANCHISE_OWNER_AND_CANNOT_PARTCIPATED",
	"User is franchise owner and can not participating"
);
define("USER_IS_NOT_FRANCHISE_MEMBER", "User is not franchise member");
define("USER_IS_FRANCHISE_MEMBER", "User is franchise member");
define("INVENTORY_NOT_FOUND", "Inventory not found")

define("OLD_PASSWORD_NOT_MATCH", "Old password not match");
define("PASSWORD_NOT_MATCH", "Passwords not match");
define("PENDING_RESULT_SUBMISSION_BY_OPPONENT", "Pending result submission by opponent")