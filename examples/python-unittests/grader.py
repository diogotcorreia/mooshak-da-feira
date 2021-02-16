import unittest
import sys
import importlib.util
import target


class TestExample(unittest.TestCase):
    def test_example(self):
        """
        Example Unit Test
        """
        self.assertTrue(
            target.example(),
            "The code must have a function called 'example' that returns True")


if __name__ == '__main__':
    unittest.main(argv=['first-arg-is-ignored'])