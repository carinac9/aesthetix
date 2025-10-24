package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.Entity.User;
import com.example.demo.Repository.UserRepository;

@AutoConfigureMockMvc
@SpringBootTest
@Transactional
class DemoApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserRepository userRepository;

	@Test
	void contextLoads() {
	}

	@Test
	void testGetAllUsers() throws Exception {
		mockMvc.perform(get("/api/users"))
				.andExpect(status().isOk());
	}

	@Test
	void testCreateUser() throws Exception {
		String uniqueUsername = "newuser_" + System.currentTimeMillis();
		String json = "{" +
				"\"username\": \"" + uniqueUsername + "\"," +
				"\"email\": \"" + uniqueUsername + "@example.com\"," +
				"\"name\": \"New User\"," +
				"\"passwordHash\": \"password\"}";
		mockMvc.perform(post("/api/users")
				.contentType(MediaType.APPLICATION_JSON)
				.content(json))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value(uniqueUsername));
	}

	@Test
	void testGetUserById() throws Exception {
		String uniqueUsername = "testuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Test User");
		user.setPasswordHash("password");
		userRepository.save(user);
		mockMvc.perform(get("/api/users/" + user.getId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(user.getId()));
	}

	@Test
	void testUpdateUser() throws Exception {
		String uniqueUsername = "updateuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Update User");
		user.setPasswordHash("password");
		userRepository.save(user);

		String updateJson = "{" +
				"\"name\": \"Updated Name\"," +
				"\"description\": \"Updated description\"," +
				"\"city\": \"Updated City\"," +
				"\"country\": \"Updated Country\"," +
				"\"zodiacSign\": \"Gemini\"}";

		mockMvc.perform(put("/api/users/update/" + user.getId())
				.contentType(MediaType.APPLICATION_JSON)
				.content(updateJson))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Updated Name"))
				.andExpect(jsonPath("$.description").value("Updated description"));
	}

	@Test
	void testDeleteUser() throws Exception {
		String uniqueUsername = "deleteuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Delete User");
		user.setPasswordHash("password");
		userRepository.save(user);

		mockMvc.perform(delete("/api/users/" + user.getId()))
				.andExpect(status().isOk());
	}

	@Test
	void testLoginUser() throws Exception {
		String uniqueUsername = "loginuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Login User");
		user.setPasswordHash("password");
		userRepository.save(user);

		String loginJson = "{" +
				"\"email\": \"" + user.getEmail() + "\"," +
				"\"password\": \"password\"}";

		mockMvc.perform(post("/api/users/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(loginJson))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value(user.getEmail()));
	}

	@Test
	void testCreateAndGetRoomProject() throws Exception {
		String uniqueUsername = "roomuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Room User");
		user.setPasswordHash("password");
		userRepository.save(user);
		String uniqueName = "RoomProject_" + System.currentTimeMillis();
		String json = "{" +
			"\"name\": \"" + uniqueName + "\"," +
			"\"userId\": " + user.getId() + "," +
			"\"polygon\": [{\"x\":0,\"y\":0},{\"x\":1,\"y\":0},{\"x\":1,\"y\":1},{\"x\":0,\"y\":1}]," +
			"\"dimensions\": {\"width\":10,\"height\":5,\"depth\":10}," +
			"\"colors\": {\"floor\":\"#e0e0e0\",\"walls\":\"#d6d6d6\",\"ceiling\":\"#ffffff\"}," +
			"\"lighting\": {\"ambient\":0.6,\"directional\":0.8}," +
			"\"furniture\": []," +
			"\"showCeiling\": true}";
		// Create
		String response = mockMvc.perform(post("/api/room-projects")
				.contentType(MediaType.APPLICATION_JSON)
				.content(json))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		Number idNum = com.jayway.jsonpath.JsonPath.read(response, "$.id");
		Long id = idNum.longValue();
		// Get
		mockMvc.perform(get("/api/room-projects/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value(uniqueName));
	}

	@Test
	void testCreateAndGetPost() throws Exception {
		String uniqueUsername = "postuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Post User");
		user.setPasswordHash("password");
		userRepository.save(user);
		// Create
		mockMvc.perform(post("/api/posts/create")
				.param("userId", user.getId().toString())
				.param("title", "Test Post")
				.param("description", "Test Description"))
				.andExpect(status().isOk());
		// Get all
		mockMvc.perform(get("/api/posts"))
				.andExpect(status().isOk());
	}

	@Test
	void testCreateAndGetNotification() throws Exception {
		String uniqueUsername = "notifuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Notif User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		// Create a dummy post for postId
		String postResponse = mockMvc.perform(post("/api/posts/create")
				.param("userId", user.getId().toString())
				.param("title", "Notif Post")
				.param("description", "Notif Desc"))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		Number postIdNum = com.jayway.jsonpath.JsonPath.read(postResponse, "$.id");
		Long postId = postIdNum.longValue();
		String json = "{" +
			"\"userId\": " + user.getId() + ", " +
			"\"type\": \"test\", " +
			"\"message\": \"msg\", " +
			"\"postId\": " + postId + "}";
		mockMvc.perform(post("/api/notifications/create")
				.contentType(MediaType.APPLICATION_JSON)
				.content(json))
				.andExpect(status().isOk());
		mockMvc.perform(get("/api/notifications/" + user.getId()))
				.andExpect(status().isOk());
	}

	@Test
	void testGetLoginActivity() throws Exception {
		mockMvc.perform(get("/api/users/login-activity/1"))
				.andExpect(status().isOk());
	}

	@Test
	void testSendAndGetFriendRequest() throws Exception {
		String userA = "friendA_" + System.currentTimeMillis();
		String userB = "friendB_" + System.currentTimeMillis();
		User u1 = new User();
		u1.setUsername(userA);
		u1.setEmail(userA + "@example.com");
		u1.setName("A");
		u1.setPasswordHash("pw");
		userRepository.save(u1);
		User u2 = new User();
		u2.setUsername(userB);
		u2.setEmail(userB + "@example.com");
		u2.setName("B");
		u2.setPasswordHash("pw");
		userRepository.save(u2);
		mockMvc.perform(post("/api/friend-requests/send")
				.param("senderId", u1.getId().toString())
				.param("receiverId", u2.getId().toString()))
				.andExpect(status().isOk());
		mockMvc.perform(get("/api/friend-requests/friends/" + u1.getId()))
				.andExpect(status().isOk());
	}

	@Test
	void testAddAndGetFavorite() throws Exception {
		String uniqueUsername = "favuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Fav User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		mockMvc.perform(post("/api/posts/create")
				.param("userId", user.getId().toString())
				.param("title", "Fav Post")
				.param("description", "Fav Desc"))
				.andExpect(status().isOk());
		Number postIdNum = com.jayway.jsonpath.JsonPath.read(mockMvc.perform(get("/api/posts"))
				.andReturn().getResponse().getContentAsString(), "$[0].id");
		Long postId = postIdNum.longValue();
		String favJson = "{" +
				"\"postId\": " + postId + ", \"userId\": " + user.getId() + "}";
		mockMvc.perform(post("/api/favorites/add")
				.contentType(MediaType.APPLICATION_JSON)
				.content(favJson))
				.andExpect(status().isOk());
		mockMvc.perform(get("/api/favorites/user/" + user.getId() + "/post/" + postId))
				.andExpect(status().isOk());
	}

	@Test
	void testAddAndGetComment() throws Exception {
		String uniqueUsername = "commentuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Comment User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		mockMvc.perform(post("/api/posts/create")
				.param("userId", user.getId().toString())
				.param("title", "Comment Post")
				.param("description", "Comment Desc"))
				.andExpect(status().isOk());
		Number postIdNum = com.jayway.jsonpath.JsonPath.read(mockMvc.perform(get("/api/posts"))
				.andReturn().getResponse().getContentAsString(), "$[0].id");
		Long postId = postIdNum.longValue();
		String commentJson = "{" +
				"\"postId\": " + postId + ", \"userId\": " + user.getId() + ", \"commentText\": \"Nice!\"}";
		mockMvc.perform(post("/api/comments/add")
				.contentType(MediaType.APPLICATION_JSON)
				.content(commentJson))
				.andExpect(status().isOk());
		mockMvc.perform(get("/api/comments/" + postId))
				.andExpect(status().isOk());
	}

	@Test
	void testRemoveFavorite() throws Exception {
		String uniqueUsername = "unfavuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Unfav User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		// Create post
		mockMvc.perform(post("/api/posts/create")
				.param("userId", user.getId().toString())
				.param("title", "Unfav Post")
				.param("description", "Unfav Desc"))
				.andExpect(status().isOk());
		Number postIdNum = com.jayway.jsonpath.JsonPath.read(mockMvc.perform(get("/api/posts"))
				.andReturn().getResponse().getContentAsString(), "$[0].id");
		Long postId = postIdNum.longValue();
		// Add favorite first
		String favJson = "{\"postId\": " + postId + ", \"userId\": " + user.getId() + "}";
		mockMvc.perform(post("/api/favorites/add")
				.contentType(MediaType.APPLICATION_JSON)
				.content(favJson))
				.andExpect(status().isOk());
		// Remove favorite
		mockMvc.perform(delete("/api/favorites/remove")
				.param("postId", postId.toString())
				.param("userId", user.getId().toString()))
				.andExpect(status().isOk());
	}

	@Test
	void testGetFavoriteCount() throws Exception {
		String uniqueUsername = "countuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Count User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		// Create post
		mockMvc.perform(post("/api/posts/create")
				.param("userId", user.getId().toString())
				.param("title", "Count Post")
				.param("description", "Count Desc"))
				.andExpect(status().isOk());
		Number postIdNum = com.jayway.jsonpath.JsonPath.read(mockMvc.perform(get("/api/posts"))
				.andReturn().getResponse().getContentAsString(), "$[0].id");
		Long postId = postIdNum.longValue();
		// Get favorite count
		mockMvc.perform(get("/api/favorites/count/" + postId))
				.andExpect(status().isOk());
	}

	@Test
	void testAcceptFriendRequest() throws Exception {
		String userA = "acceptA_" + System.currentTimeMillis();
		String userB = "acceptB_" + System.currentTimeMillis();
		User u1 = new User();
		u1.setUsername(userA);
		u1.setEmail(userA + "@example.com");
		u1.setName("A");
		u1.setPasswordHash("pw");
		userRepository.save(u1);
		User u2 = new User();
		u2.setUsername(userB);
		u2.setEmail(userB + "@example.com");
		u2.setName("B");
		u2.setPasswordHash("pw");
		userRepository.save(u2);
		// Send friend request
		mockMvc.perform(post("/api/friend-requests/send")
				.param("senderId", u1.getId().toString())
				.param("receiverId", u2.getId().toString()))
				.andExpect(status().isOk());
		// For simplicity, we'll test the accept endpoint with a mock request ID
		// In a real scenario, you'd parse the response to get the actual request ID
		mockMvc.perform(post("/api/friend-requests/accept")
				.param("requestId", "1"))
				.andExpect(status().isOk());
	}

	@Test
	void testDeclineFriendRequest() throws Exception {
		mockMvc.perform(post("/api/friend-requests/decline")
				.param("requestId", "1"))
				.andExpect(status().isOk());
	}

	@Test
	void testGetPendingFriendRequests() throws Exception {
		String uniqueUsername = "pendinguser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Pending User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		mockMvc.perform(get("/api/friend-requests/pending/" + user.getId()))
				.andExpect(status().isOk());
	}

	@Test
	void testGetSentFriendRequests() throws Exception {
		String uniqueUsername = "sentuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Sent User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		mockMvc.perform(get("/api/friend-requests/sent/" + user.getId()))
				.andExpect(status().isOk());
	}

	@Test
	void testUnfriend() throws Exception {
		String unfriendJson = "{\"userId1\": 1, \"userId2\": 2}";
		mockMvc.perform(post("/api/friend-requests/unfriend")
				.contentType(MediaType.APPLICATION_JSON)
				.content(unfriendJson))
				.andExpect(status().isOk());
	}

	@Test
	void testGetUnreadNotificationCount() throws Exception {
		String uniqueUsername = "unreaduser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Unread User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		mockMvc.perform(get("/api/notifications/" + user.getId() + "/unread-count"))
				.andExpect(status().isOk());
	}

	@Test
	void testMarkAllNotificationsAsRead() throws Exception {
		String uniqueUsername = "readuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Read User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		mockMvc.perform(put("/api/notifications/" + user.getId() + "/mark-all-read"))
				.andExpect(status().isOk());
	}

	@Test
	void testDeleteComment() throws Exception {
		mockMvc.perform(delete("/api/comments/1"))
				.andExpect(status().isNoContent());
	}

	@Test
	void testGetPostById() throws Exception {
		String uniqueUsername = "postbyid_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Post ById User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		// Create post
		String response = mockMvc.perform(post("/api/posts/create")
				.param("userId", user.getId().toString())
				.param("title", "Get Post")
				.param("description", "Get Post Desc"))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		Number postIdNum = com.jayway.jsonpath.JsonPath.read(response, "$.id");
		Long postId = postIdNum.longValue();
		// Get post by ID
		mockMvc.perform(get("/api/posts/" + postId))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.title").value("Get Post"));
	}

	@Test
	void testGetUserPosts() throws Exception {
		String uniqueUsername = "userposts_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("User Posts");
		user.setPasswordHash("pw");
		userRepository.save(user);
		// Create post
		mockMvc.perform(post("/api/posts/create")
				.param("userId", user.getId().toString())
				.param("title", "User Post")
				.param("description", "User Post Desc"))
				.andExpect(status().isOk());
		// Get user posts
		mockMvc.perform(get("/api/posts/user/" + user.getId()))
				.andExpect(status().isOk());
	}

	@Test
	void testDeletePost() throws Exception {
		String uniqueUsername = "deletepost_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Delete Post User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		// Create post
		String response = mockMvc.perform(post("/api/posts/create")
				.param("userId", user.getId().toString())
				.param("title", "Delete Post")
				.param("description", "Delete Post Desc"))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		Number postIdNum = com.jayway.jsonpath.JsonPath.read(response, "$.id");
		Long postId = postIdNum.longValue();
		// Delete post
		mockMvc.perform(delete("/api/posts/" + postId))
				.andExpect(status().isNoContent());
	}

	@Test
	void testUpdateRoomProject() throws Exception {
		String uniqueUsername = "updateroom_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Update Room User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		String uniqueName = "UpdateRoom_" + System.currentTimeMillis();
		// Create room project
		String createJson = "{" +
			"\"name\": \"" + uniqueName + "\"," +
			"\"userId\": " + user.getId() + "," +
			"\"polygon\": [{\"x\":0,\"y\":0},{\"x\":1,\"y\":0},{\"x\":1,\"y\":1},{\"x\":0,\"y\":1}]," +
			"\"dimensions\": {\"width\":10,\"height\":5,\"depth\":10}," +
			"\"colors\": {\"floor\":\"#e0e0e0\",\"walls\":\"#d6d6d6\",\"ceiling\":\"#ffffff\"}," +
			"\"lighting\": {\"ambient\":0.6,\"directional\":0.8}," +
			"\"furniture\": []," +
			"\"showCeiling\": true}";
		String response = mockMvc.perform(post("/api/room-projects")
				.contentType(MediaType.APPLICATION_JSON)
				.content(createJson))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		Number idNum = com.jayway.jsonpath.JsonPath.read(response, "$.id");
		Long id = idNum.longValue();
		// Update room project
		String updateJson = "{" +
			"\"name\": \"Updated " + uniqueName + "\"," +
			"\"userId\": " + user.getId() + "," +
			"\"polygon\": [{\"x\":0,\"y\":0},{\"x\":2,\"y\":0},{\"x\":2,\"y\":2},{\"x\":0,\"y\":2}]," +
			"\"dimensions\": {\"width\":12,\"height\":6,\"depth\":12}," +
			"\"colors\": {\"floor\":\"#f0f0f0\",\"walls\":\"#e6e6e6\",\"ceiling\":\"#ffffff\"}," +
			"\"lighting\": {\"ambient\":0.7,\"directional\":0.9}," +
			"\"furniture\": []," +
			"\"showCeiling\": false}";
		mockMvc.perform(put("/api/room-projects/" + id)
				.contentType(MediaType.APPLICATION_JSON)
				.content(updateJson))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Updated " + uniqueName));
	}

	@Test
	void testDeleteRoomProject() throws Exception {
		String uniqueUsername = "deleteroom_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Delete Room User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		String uniqueName = "DeleteRoom_" + System.currentTimeMillis();
		// Create room project
		String createJson = "{" +
			"\"name\": \"" + uniqueName + "\"," +
			"\"userId\": " + user.getId() + "," +
			"\"polygon\": [{\"x\":0,\"y\":0},{\"x\":1,\"y\":0},{\"x\":1,\"y\":1},{\"x\":0,\"y\":1}]," +
			"\"dimensions\": {\"width\":10,\"height\":5,\"depth\":10}," +
			"\"colors\": {\"floor\":\"#e0e0e0\",\"walls\":\"#d6d6d6\",\"ceiling\":\"#ffffff\"}," +
			"\"lighting\": {\"ambient\":0.6,\"directional\":0.8}," +
			"\"furniture\": []," +
			"\"showCeiling\": true}";
		String response = mockMvc.perform(post("/api/room-projects")
				.contentType(MediaType.APPLICATION_JSON)
				.content(createJson))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		Number idNum = com.jayway.jsonpath.JsonPath.read(response, "$.id");
		Long id = idNum.longValue();
		// Delete room project
		mockMvc.perform(delete("/api/room-projects/" + id))
				.andExpect(status().isOk());
	}

	@Test
	void testGetUserRoomProjects() throws Exception {
		String uniqueUsername = "userroomprojects_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("User Room Projects");
		user.setPasswordHash("pw");
		userRepository.save(user);
		mockMvc.perform(get("/api/room-projects/user/" + user.getId()))
				.andExpect(status().isOk());
	}

	@Test
	void testSearchUsers() throws Exception {
		String uniqueUsername = "searchuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Search User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		mockMvc.perform(get("/api/users/search")
				.param("username", "search")
				.param("currentUserId", user.getId().toString()))
				.andExpect(status().isOk());
	}

	@Test
	void testGetUserPreview() throws Exception {
		String uniqueUsername = "previewuser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Preview User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		mockMvc.perform(get("/api/users/preview/" + user.getId())
				.param("viewerId", user.getId().toString()))
				.andExpect(status().isOk());
	}

	@Test
	void testGetUserPreviewByUsername() throws Exception {
		String uniqueUsername = "previewbyname_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Preview By Name User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		mockMvc.perform(get("/api/users/preview-by-username/" + uniqueUsername)
				.param("viewerId", user.getId().toString()))
				.andExpect(status().isOk());
	}

	@Test
	void testPingOnline() throws Exception {
		String uniqueUsername = "pinguser_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Ping User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		mockMvc.perform(post("/api/users/ping")
				.param("userId", user.getId().toString()))
				.andExpect(status().isOk());
	}

	@Test
	void testGetPrivacySettings() throws Exception {
		String uniqueUsername = "privacyget_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Privacy Get User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		mockMvc.perform(get("/api/users/privacy-settings")
				.param("email", user.getEmail()))
				.andExpect(status().isOk());
	}

	@Test
	void testUpdatePrivacySettingsPost() throws Exception {
		String uniqueUsername = "privacypost_" + System.currentTimeMillis();
		User user = new User();
		user.setUsername(uniqueUsername);
		user.setEmail(uniqueUsername + "@example.com");
		user.setName("Privacy Post User");
		user.setPasswordHash("pw");
		userRepository.save(user);
		String updateJson = "{\"showOnlineStatus\": false, \"profileVisibility\": \"private\"}";
		mockMvc.perform(post("/api/users/privacy-settings")
				.param("email", user.getEmail())
				.contentType(MediaType.APPLICATION_JSON)
				.content(updateJson))
				.andExpect(status().isOk());
	}
}
