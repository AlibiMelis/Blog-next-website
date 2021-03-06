import Loader from "../components/Loader";
import Metatags from "../components/Metatags";
import { firestore, fromMillis, postToJSON } from "../lib/firebase";
import { useState } from "react";
import PostFeed from "../components/PostFeed";

const LIMIT = 5;

export async function getServerSideProps(context) {
  let ref = firestore
    .collectionGroup("posts")
    .where("published", "==", true)
    .orderBy("createdAt", "desc")
    .limit(LIMIT);

  let posts = (await ref.get()).docs.map(postToJSON);

  return { props: { posts } };
}

export default function Home(props) {
  const [posts, setPosts] = useState(props.posts);
  const [loading, setLoading] = useState(false);
  const [postsEnd, setPostsEnd] = useState(false);

  const getMorePosts = async () => {
    setLoading(true);

    const last = posts[posts.length - 1];

    const cursor =
      typeof last.createdAt === "number"
        ? fromMillis(last.createdAt)
        : last.createdAt;

    const query = firestore
      .collectionGroup("posts")
      .where("published", "==", true)
      .orderBy("createdAt", "desc")
      .startAfter(cursor)
      .limit(LIMIT);

    const newPosts = (await query.get()).docs.map(postToJSON);

    setPosts(posts.concat(newPosts));
    setLoading(false);

    if (newPosts.length < LIMIT) {
      setPostsEnd(true);
    }
  };

  return (
    <main>
      <Metatags title="Feed"/>
      <PostFeed posts={posts} />

      <Loader show={loading} />

      {!loading && !postsEnd && (
        <button onClick={getMorePosts}>Load more</button>
      )}

      {postsEnd && "You have reached the end."}
    </main>
  );
}
