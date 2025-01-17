import { useRequest } from 'ahooks';
import { useCallback, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useNavigate } from 'react-router-dom';

import style from './style.css';

import { Button } from '@/components/Button';
import { createVote } from '@/services/votes/createVote';
import { queryVote } from '@/services/votes/queryVote';
import { updateVote } from '@/services/votes/updateVote';
import { myAtom } from '@/store/auth';
import { createStyler } from '@/utils/styler';
import { PATH } from '@/const';

const styler = createStyler(style);

interface Props {
  talk: Schema.Talk;
  onChange: () => void;
}

export function VoteButton(props: Props) {
  const { talk, onChange } = props;

  const my = useRecoilValue(myAtom);
  const navigate = useNavigate();

  const [vote, save] = useMyVote(talk.id, onChange);
  const voted = my != null && vote?.active;

  const handleVoteClick = () => {
    if (my == null) {
      navigate(PATH.LOGIN);
    } else {
      save();
    }
  };

  return (
    <Button
      className={styler('talk-vote-button', voted && 'voted-button')}
      shape="outline"
      onClick={handleVoteClick}
    >
      <span className={styler('vote-icon')} />
      {talk.voted}
      <span className={styler('vote-hint')}>{voted ? 'unvote' : 'upvote'}</span>
    </Button>
  );
}

function useMyVote(talkId: number, onChange: () => void) {
  const my = useRecoilValue(myAtom);

  const [vote, setVote] = useState<Schema.Vote | null>(null);
  const handleVoteChange = (data: Schema.Vote) => {
    setVote(data);
    onChange();
  };

  useRequest(queryVote, {
    defaultParams: [{ talkId, ownerId: my?.id ?? 0 }],
    ready: my != null,
    onSuccess: setVote,
  });
  const { run: create } = useRequest(createVote, { manual: true, onSuccess: handleVoteChange });
  const { run: update } = useRequest(updateVote, { manual: true, onSuccess: handleVoteChange });

  const handleSave = useCallback(() => {
    if (vote == null) {
      create({ talkId });
    } else {
      update({ id: vote.id, active: !vote.active });
    }
  }, [create, talkId, update, vote]);

  return [vote, handleSave] as const;
}
