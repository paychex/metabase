import React from 'react'
import { connect } from 'react-redux'
import { Link } from "metabase/spaces/Link"
import { Box, Border, Flex, Heading, Subhead } from 'rebass'

import Select from 'metabase/components/Select'

import { getQuestionsForSpace, getCurrentSpace } from './selectors'

import PinLink from './PinLink'

import { pinItem } from './spaces'
import { getAllEntities } from "metabase/questions/selectors";
import { loadEntities } from "metabase/questions/questions";
import { Component } from "react/lib/ReactBaseClasses";

const mapStateToProps = (state) => {
    return {
        space: getCurrentSpace(state),
        // questions: getQuestionsForSpace(state)
        // NOTE Atte Keinänen: just a quick n' dirty way to get a list of all questions
        questions: getAllEntities(state)
    }
}

class Questions extends Component  {
    componentWillMount() {
        this.props.loadEntities("cards", {f: "all", collection: "", ...location.query});
    }

    render() {
        const { questions, space, dispatch } = this.props

        return (
            <div>
                <Box w={2/3}>
                    <Flex align='center' mb={3}>
                        <Heading>
                            Questions
                        </Heading>
                        <Box ml='auto'>
                            <Select
                                width={200}
                                value={{ name: 'All', value: 'all' }}
                                options={[
                                    { name: 'All', value: 'all' },
                                    { name: 'Mine', value: 'mine' },
                                    { name: 'Favorites', value: 'favorites' },
                                ]}
                                search={false}
                                clearable={false}
                            />
                        </Box>
                    </Flex>
                    { questions.map(q =>
                        <Border bottom py={1}>
                            <Flex align='center'>
                                <Link to='Question' params={{ space: space.slug, id: q.id }}>
                                    <h3>{q.name}</h3>
                                </Link>
                                <Box ml='auto'>
                                    <Flex align='center'>
                                        <Box mx={2}>
                                            <PinLink />
                                        </Box>
                                        <Box onClick={() => dispatch(pinItem(space.id, 'question', q))}>
                                            ARCHIVE
                                        </Box>
                                    </Flex>
                                </Box>
                            </Flex>
                        </Border>
                    )}
                </Box>
            </div>
        )
    }
}

export default connect(mapStateToProps, { loadEntities })(Questions)
